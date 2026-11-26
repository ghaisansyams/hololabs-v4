import "server-only";
import { sql } from "drizzle-orm";
import { getDb, rows } from "@/lib/db/client";
import { MAX_GUESTS, seatLabels, sortSeats } from "@/lib/services/seat-booking";

/**
 * Admin edits of an existing order: move it to another show and/or change its
 * seats (a reschedule, or a guest asking for a refund of one seat). The guest
 * paid for a fixed number of seats, so an edit can never hold more seats than
 * the order already has. The booking is flagged `change_pending`; the admin
 * action emails the guest and clears the flag (a failed send leaves it on, and
 * "Kirim email perubahan" in the Aksi column retries).
 */

let ready: Promise<void> | null = null;

/** Adds the two columns this feature needs, once per server process, so an older database keeps working. */
export function ensureChangeColumns(): Promise<void> {
  ready ??= (async () => {
    await rows(sql`alter table bookings add column if not exists change_pending boolean not null default false`);
    await rows(sql`alter table bookings add column if not exists change_email_at timestamptz`);
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export interface EditableSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  left: number;
  price: number;
  current: boolean;
}

/** Upcoming shows (plus the order's own show, even when it is in the past) to pick from. */
export async function listEditableSessions(bookingId: string): Promise<EditableSession[]> {
  const list = await rows<{
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    seats_left: number;
    price: string;
    current: boolean;
  }>(sql`
    select a.id, a.session_date, a.start_time, a.end_time, a.capacity, a.seats_left, a.price,
           (a.id = b.session_id) as current
    from session_availability a
    cross join (select session_id from bookings where id = ${bookingId}::uuid) b
    where a.id = b.session_id
       or (a.session_date::date + a.start_time::time) > (now() at time zone 'Asia/Jakarta')
    order by a.session_date, a.start_time
    limit 200`);
  return list.map((r) => ({
    id: r.id,
    date: r.session_date,
    startTime: r.start_time.slice(0, 5),
    endTime: r.end_time.slice(0, 5),
    capacity: r.capacity,
    left: Math.max(0, r.seats_left),
    price: Number(r.price),
    current: r.current,
  }));
}

/** Seats other orders hold in a show; the order being edited keeps its own seats free to re-pick. */
export async function takenSeatsExcluding(sessionId: string, bookingId: string): Promise<string[]> {
  const list = await rows<{ label: string }>(sql`
    select distinct label
    from bookings b, unnest(b.seat_labels) as label
    where b.session_id = ${sessionId}::uuid and b.status <> 'CANCELLED' and b.id <> ${bookingId}::uuid`);
  return sortSeats(list.map((r) => r.label));
}

export type UpdateResult =
  | { ok: true; amount: number; previousAmount: number; changed: boolean }
  | { ok: false; error: string };

export async function updateBookingShow(bookingId: string, sessionId: string, wanted: string[]): Promise<UpdateResult> {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !/^[0-9a-f-]{36}$/i.test(sessionId)) return { ok: false, error: "Data tidak valid." };
  const seats = sortSeats(Array.from(new Set(wanted.map(String))));
  if (seats.length === 0) return { ok: false, error: "Pilih minimal satu kursi." };
  if (seats.length > MAX_GUESTS) return { ok: false, error: `Maksimal ${MAX_GUESTS} kursi per pesanan.` };
  await ensureChangeColumns();

  try {
    return await getDb().transaction(async (tx) => {
      const run = async <T,>(query: ReturnType<typeof sql>) => (await tx.execute(query)).rows as T[];

      const [booking] = await run<{
        id: string;
        session_id: string;
        seats: number;
        amount: string;
        status: string;
        checkin_status: string;
        seat_labels: string[];
      }>(sql`select id, session_id, seats, amount, status, checkin_status, seat_labels from bookings where id = ${bookingId}::uuid for update`);
      if (!booking) return { ok: false as const, error: "Booking tidak ditemukan." };
      if (booking.status === "CANCELLED") return { ok: false as const, error: "Booking ini sudah dibatalkan, tidak bisa diubah." };
      if (booking.checkin_status === "CHECKED_IN") return { ok: false as const, error: "Tamu ini sudah check-in, jadwal dan kursi tidak bisa diubah." };
      if (seats.length > booking.seats) {
        return { ok: false as const, error: `Maksimal ${booking.seats} kursi, sesuai pembayaran pelanggan.` };
      }

      // Lock both shows in a fixed order so two edits can never wait on each other.
      const ids = Array.from(new Set([booking.session_id, sessionId])).sort();
      const locked = await run<{ id: string; capacity: number; price: string }>(
        sql`select id, capacity, price from sessions where id in (${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}) order by id for update`,
      );
      const target = locked.find((s) => s.id === sessionId);
      if (!target) return { ok: false as const, error: "Jadwal tidak ditemukan." };

      const valid = new Set(seatLabels(target.capacity));
      if (seats.some((s) => !valid.has(s))) return { ok: false as const, error: "Nomor kursi tidak valid untuk jadwal ini." };

      const others = await run<{ label: string }>(sql`
        select distinct label from bookings b, unnest(b.seat_labels) as label
        where b.session_id = ${sessionId}::uuid and b.status <> 'CANCELLED' and b.id <> ${bookingId}::uuid`);
      const taken = new Set(others.map((r) => r.label));
      const clash = seats.filter((s) => taken.has(s));
      if (clash.length) return { ok: false as const, error: `Kursi ${clash.join(", ")} sudah dipesan orang lain di jadwal ini.` };

      const same = booking.session_id === sessionId && sortSeats(booking.seat_labels ?? []).join(",") === seats.join(",");
      const previousAmount = Number(booking.amount);
      if (same) return { ok: true as const, amount: previousAmount, previousAmount, changed: false };

      const [payment] = await run<{ unique_code: number }>(sql`select unique_code from payments where booking_id = ${bookingId}::uuid order by created_at desc limit 1`);
      const amount = Number(target.price) * seats.length + (payment?.unique_code ?? 0);

      await tx.execute(sql`update sessions set seats_taken = greatest(0, seats_taken - ${booking.seats}) where id = ${booking.session_id}::uuid`);
      await tx.execute(sql`update sessions set seats_taken = seats_taken + ${seats.length} where id = ${sessionId}::uuid`);
      await tx.execute(sql`
        update bookings
        set session_id = ${sessionId}::uuid, requested_session_id = ${sessionId}::uuid, seats = ${seats.length},
            seat_labels = ${`{${seats.join(",")}}`}::text[], amount = ${amount}::numeric, change_pending = true
        where id = ${bookingId}::uuid`);
      await tx.execute(sql`update payments set amount = ${amount}::numeric where booking_id = ${bookingId}::uuid`);
      return { ok: true as const, amount, previousAmount, changed: true };
    });
  } catch (cause) {
    console.error("[booking] gagal mengubah booking", cause);
    return { ok: false, error: "Gagal menyimpan perubahan. Coba lagi sebentar lagi." };
  }
}
