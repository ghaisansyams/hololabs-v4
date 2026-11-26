import "server-only";
import { sql } from "drizzle-orm";
import { dbErrorMessage, isDatabaseConfigured, rows } from "@/lib/db/client";
import { MAX_GUESTS } from "@/lib/services/seat-booking-constants";

/**
 * The booking flow of hololabs.id/booking, end to end: a 30-day schedule of
 * shows, an 18-seat map per show, at most six seats per order, contact
 * details, terms, then a bank transfer within 90 minutes whose amount has a
 * unique code (Rp10–99) added on top so the team recognises it.
 *
 * The shapes returned here are the ones hololabs.id's /api/booking/*
 * endpoints return, so the page and the API routes stay drop-in compatible.
 */

export { MAX_GUESTS };
export const PAYMENT_MINUTES = 90;
/** Range of the unique code added to each order's transfer amount. */
export const UNIQUE_CODE_MIN = 10;
export const UNIQUE_CODE_MAX = 99;
export const SCHEDULE_DAYS = 30;
const PACKAGE_ID = "journey";

export interface BookingSession {
  id: string;
  date: string;
  /** "18:00" */
  startTime: string;
  durationMinutes: number;
  capacity: number;
  left: number;
  price: number;
  bookable: boolean;
}

export interface BookingDay {
  date: string;
  sessions: BookingSession[];
}

/** Seat labels on the map: "1" … "18". */
export function seatLabels(capacity: number): string[] {
  return Array.from({ length: capacity }, (_, i) => String(i + 1));
}

export function sortSeats(labels: string[]): string[] {
  return [...labels].sort((a, b) => Number(a) - Number(b));
}

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Housekeeping run before every read and write: roll the schedule forward, free expired holds. */
async function housekeeping() {
  await rows(sql`select ensure_schedule(${SCHEDULE_DAYS}::int)`);
  await rows(sql`select expire_unpaid_bookings()`);
}

export async function getBookingDays(): Promise<BookingDay[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    await housekeeping();
    const list = await rows<{
      id: string;
      session_date: string;
      start_time: string;
      end_time: string;
      capacity: number;
      seats_left: number;
      price: string;
      closed: boolean;
    }>(sql`
      with today as (select (now() at time zone 'Asia/Jakarta') as now_local)
      select a.id, a.session_date, a.start_time, a.end_time, a.capacity, a.seats_left, a.price,
             (a.session_date::date + a.start_time::time) <= today.now_local as closed
      from session_availability a, today
      where a.session_date::date between today.now_local::date and today.now_local::date + ${SCHEDULE_DAYS - 1}::int
      order by a.session_date, a.start_time`);

    const byDate = new Map<string, BookingSession[]>();
    for (const r of list) {
      const start = r.start_time.slice(0, 5);
      let duration = minutesOf(r.end_time.slice(0, 5)) - minutesOf(start);
      if (duration <= 0) duration += 24 * 60;
      const left = Math.max(0, r.seats_left);
      const session: BookingSession = {
        id: r.id,
        date: r.session_date,
        startTime: start,
        durationMinutes: duration,
        capacity: r.capacity,
        left,
        price: Number(r.price),
        bookable: left > 0 && !r.closed,
      };
      byDate.set(r.session_date, [...(byDate.get(r.session_date) ?? []), session]);
    }
    return Array.from(byDate, ([date, sessions]) => ({ date, sessions }));
  } catch (error) {
    console.error("[booking] gagal membaca jadwal", error);
    return [];
  }
}

export async function getTakenSeats(sessionId: string): Promise<string[] | null> {
  if (!isDatabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  try {
    await rows(sql`select expire_unpaid_bookings()`);
    const [row] = await rows<{ taken: string[] }>(sql`select session_taken_seats(${sessionId}::uuid) as taken`);
    return sortSeats(row?.taken ?? []);
  } catch {
    return null;
  }
}

export interface BookingInput {
  sessionId: string;
  seats: string[];
  name: string;
  email: string;
  whatsapp: string;
  note: string;
  agree: boolean;
}

export type BookingFieldErrors = Partial<Record<"sessionId" | "seats" | "name" | "email" | "whatsapp" | "note" | "agree", string>>;

export type CreateResult =
  | { ok: true; url: string; bookingId: string }
  | { ok: false; status: number; error: string; fieldErrors?: BookingFieldErrors; taken?: string[] };

/** Same rules, same wording as hololabs.id's form. */
export function validateBookingInput(input: BookingInput): BookingFieldErrors {
  const errors: BookingFieldErrors = {};
  if (input.name.trim().length < 2) errors.name = "Nama minimal 2 huruf";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) errors.email = "Format email belum benar";
  if (!/^628\d{7,12}$/.test(toE164(input.whatsapp))) errors.whatsapp = "Nomor WhatsApp belum benar (contoh: 0812 3456 7890)";
  if (input.note.length > 300) errors.note = "Catatan maksimal 300 karakter";
  if (!input.agree) errors.agree = "Centang persetujuan syarat & ketentuan dulu.";
  if (!input.sessionId) errors.sessionId = "Pilih jadwal show yang masih tersedia.";
  if (!input.seats.length) errors.seats = "Pilih kursi dulu di denah.";
  else if (input.seats.length > MAX_GUESTS) errors.seats = `Maksimal ${MAX_GUESTS} kursi per pesanan.`;
  return errors;
}

/** 0812… / 812… / +62812… → 62812… */
export function toE164(whatsapp: string): string {
  return whatsapp.replace(/[^\d]/g, "").replace(/^0/, "62").replace(/^8/, "628");
}

export async function createSeatBooking(input: BookingInput): Promise<CreateResult> {
  if (!isDatabaseConfigured()) return { ok: false, status: 503, error: "Booking sedang tidak tersedia. Coba lagi nanti." };

  const fieldErrors = validateBookingInput(input);
  if (Object.keys(fieldErrors).length) {
    return { ok: false, status: 400, error: "Periksa kembali isian kamu.", fieldErrors };
  }

  await housekeeping();

  const [session] = await rows<{ id: string; capacity: number; price: string }>(
    sql`select id, capacity, price from sessions where id = ${input.sessionId}::uuid`,
  ).catch(() => []);
  if (!session) {
    return { ok: false, status: 400, error: "Jadwal tidak ditemukan. Pilih jadwal lain.", fieldErrors: { sessionId: "Jadwal tidak ditemukan." } };
  }
  const valid = new Set(seatLabels(session.capacity));
  const seats = sortSeats(Array.from(new Set(input.seats.map(String))));
  if (seats.some((s) => !valid.has(s))) {
    return { ok: false, status: 400, error: "Nomor kursi tidak valid. Pilih ulang di denah.", fieldErrors: { seats: "Kursi tidak valid." } };
  }

  let customer: { id: string } | undefined;
  try {
    [customer] = await rows<{ id: string }>(
      sql`select * from upsert_customer(${input.name.trim()}, ${"0" + toE164(input.whatsapp).slice(2)}, ${input.email.trim()})`,
    );
  } catch {
    customer = undefined;
  }
  if (!customer) return { ok: false, status: 500, error: "Gagal menyimpan data pemesan. Coba lagi sebentar lagi." };

  // A unique code no other open transfer is using, so each mutation maps to one order.
  const used = new Set(
    (
      await rows<{ unique_code: number }>(
        sql`select unique_code from payments where status in ('PENDING', 'SUBMITTED') and unique_code > 0`,
      )
    ).map((r) => r.unique_code),
  );
  const span = UNIQUE_CODE_MAX - UNIQUE_CODE_MIN + 1;
  const free = Array.from({ length: span }, (_, i) => UNIQUE_CODE_MIN + i).filter((c) => !used.has(c));
  const uniqueCode = free.length ? free[Math.floor(Math.random() * free.length)] : UNIQUE_CODE_MIN + Math.floor(Math.random() * span);
  const amount = Number(session.price) * seats.length + uniqueCode;

  // Passed as a Postgres array literal: the labels are digits only (checked above).
  let booking: { id: string; access_token: string } | undefined;
  try {
    [booking] = await rows<{ id: string; access_token: string }>(
      sql`select * from create_seat_booking(${customer.id}::uuid, ${session.id}::uuid, ${PACKAGE_ID}, ${`{${seats.join(",")}}`}::text[], ${amount}::numeric, ${input.note.trim()})`,
    );
  } catch (cause) {
    const message = dbErrorMessage(cause);
    const clash = message.match(/SEATS_TAKEN:([\d,]+)/);
    if (clash) {
      const taken = (await getTakenSeats(session.id)) ?? [];
      return {
        ok: false,
        status: 409,
        error: `Kursi ${clash[1].split(",").join(", ")} baru saja dipesan orang lain. Silakan pilih kursi lain.`,
        fieldErrors: { seats: "Kursi sudah terisi." },
        taken,
      };
    }
    if (message.includes("SESSION_CLOSED")) {
      return { ok: false, status: 409, error: "Jadwal ini sudah ditutup. Pilih jadwal lain.", fieldErrors: { sessionId: "Jadwal ditutup." } };
    }
    if (message.includes("NO_AVAILABILITY")) {
      return { ok: false, status: 409, error: "Kursi untuk jadwal ini tidak cukup. Pilih jadwal lain.", fieldErrors: { sessionId: "Kursi tidak cukup." } };
    }
    console.error("[booking] gagal membuat booking", cause);
    return { ok: false, status: 500, error: "Gagal membuat booking. Coba lagi sebentar lagi." };
  }
  if (!booking) return { ok: false, status: 500, error: "Gagal membuat booking. Coba lagi sebentar lagi." };

  const expiresAt = new Date(Date.now() + PAYMENT_MINUTES * 60 * 1000).toISOString();
  await rows(sql`select * from create_payment_with_code(${booking.id}::uuid, ${amount}::numeric, ${uniqueCode}::int, ${expiresAt}::timestamptz)`);

  return { ok: true, url: `/pembayaran/${booking.access_token}`, bookingId: booking.id };
}
