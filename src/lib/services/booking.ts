import { getSql } from "@/lib/db/client";
import type { ContactFormValues } from "@/lib/utils/validation";
import type { BookingView, BookingStatus, CheckinStatus, PaymentStatus } from "@/lib/types";
import { createPayment } from "./payment";

export interface CreateBookingRequest {
  sessionId: string;
  packageId: string;
  seats: number;
  unitPrice: number;
  contact: ContactFormValues;
}

export type CreateBookingResult =
  | { ok: true; accessToken: string; autoRouted: boolean }
  | { ok: false; error: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBookingView(row: any): BookingView {
  return {
    bookingId: row.booking_id,
    bookingNumber: row.booking_number,
    status: row.status as BookingStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    checkinStatus: row.checkin_status as CheckinStatus,
    seats: row.seats,
    amount: Number(row.amount),
    autoRouted: row.auto_routed,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    packageId: row.package_id,
    packageName: row.package_name,
    customerFullName: row.customer_full_name,
    customerWhatsapp: row.customer_whatsapp,
    paymentId: row.payment_id,
    paymentStatusLive: row.payment_status_live,
    paymentExpiresAt: row.payment_expires_at,
  };
}

/** Payment window: a QRIS code is only meaningful for a little while. */
const PAYMENT_WINDOW_MINUTES = 60;

export async function createBooking(request: CreateBookingRequest): Promise<CreateBookingResult> {
  const sql = getSql();
  const { contact, sessionId, packageId, seats, unitPrice } = request;

  let customer;
  try {
    const rows = await sql`
      select * from upsert_customer(${contact.fullName.trim()}, ${contact.whatsapp.trim()}, ${contact.email.trim()})
    `;
    customer = rows[0];
  } catch {
    return { ok: false, error: "Gagal menyimpan data pemesan. Coba lagi sebentar lagi." };
  }
  if (!customer) {
    return { ok: false, error: "Gagal menyimpan data pemesan. Coba lagi sebentar lagi." };
  }

  const amount = unitPrice * seats;
  let booking;
  try {
    const rows = await sql`
      select * from create_booking(${customer.id}, ${sessionId}, ${packageId}, ${seats}, ${amount})
    `;
    booking = rows[0];
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("NO_AVAILABILITY")) {
      return {
        ok: false,
        error:
          "Tidak ada sesi dengan kursi cukup untuk jumlah yang diminta, termasuk sesi berikutnya. Coba kurangi jumlah kursi atau pilih tanggal lain.",
      };
    }
    return { ok: false, error: "Gagal membuat booking. Coba lagi sebentar lagi." };
  }

  const expiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();
  await createPayment({ bookingId: booking.id, amount, expiresAt });

  return { ok: true, accessToken: booking.access_token, autoRouted: booking.auto_routed };
}

export async function getBookingByToken(token: string): Promise<BookingView | null> {
  try {
    const sql = getSql();
    const rows = await sql`select * from get_booking_by_token(${token})`;
    const row = rows[0];
    if (!row) return null;
    return mapBookingView(row);
  } catch {
    return null;
  }
}

export interface CheckInResult {
  ok: boolean;
  error?: string;
  customerFullName?: string;
  sessionDate?: string;
  startTime?: string;
  alreadyCheckedIn?: boolean;
}

export async function checkInBooking(bookingNumber: string, whatsapp: string): Promise<CheckInResult> {
  try {
    const sql = getSql();
    const rows = await sql`select * from check_in_booking(${bookingNumber.trim()}, ${whatsapp.trim()})`;
    const row = rows[0];
    return {
      ok: true,
      customerFullName: row.customer_full_name,
      sessionDate: row.session_date,
      startTime: row.start_time,
      alreadyCheckedIn: row.already_checked_in,
    };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("NOT_FOUND")) {
      return { ok: false, error: "Nomor booking tidak ditemukan." };
    }
    if (message.includes("CONTACT_MISMATCH")) {
      return { ok: false, error: "Nomor WhatsApp tidak sesuai dengan data booking." };
    }
    if (message.includes("NOT_PAID")) {
      return { ok: false, error: "Booking ini belum dibayar — verifikasi pembayaran dahulu." };
    }
    return { ok: false, error: "Gagal memproses check-in." };
  }
}
