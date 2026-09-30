import { getSupabase } from "@/lib/supabase/client";
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
  const supabase = getSupabase();
  const { contact, sessionId, packageId, seats, unitPrice } = request;

  const { data: customerRow, error: customerError } = await supabase.rpc("upsert_customer", {
    p_full_name: contact.fullName.trim(),
    p_whatsapp: contact.whatsapp.trim(),
    p_email: contact.email.trim(),
  });
  if (customerError || !customerRow) {
    return { ok: false, error: "Gagal menyimpan data pemesan. Coba lagi sebentar lagi." };
  }
  const customer = Array.isArray(customerRow) ? customerRow[0] : customerRow;

  const amount = unitPrice * seats;
  const { data: bookingRow, error: bookingError } = await supabase.rpc("create_booking", {
    p_customer_id: customer.id,
    p_requested_session_id: sessionId,
    p_package_id: packageId,
    p_seats: seats,
    p_amount: amount,
  });

  if (bookingError) {
    if (bookingError.message?.includes("NO_AVAILABILITY")) {
      return {
        ok: false,
        error:
          "Tidak ada sesi dengan kursi cukup untuk jumlah yang diminta, termasuk sesi berikutnya. Coba kurangi jumlah kursi atau pilih tanggal lain.",
      };
    }
    return { ok: false, error: "Gagal membuat booking. Coba lagi sebentar lagi." };
  }

  const booking = Array.isArray(bookingRow) ? bookingRow[0] : bookingRow;

  const expiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();
  await createPayment({ bookingId: booking.id, amount, expiresAt });

  return { ok: true, accessToken: booking.access_token, autoRouted: booking.auto_routed };
}

export async function getBookingByToken(token: string): Promise<BookingView | null> {
  const { data, error } = await getSupabase().rpc("get_booking_by_token", { p_token: token });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return mapBookingView(row);
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
  const { data, error } = await getSupabase().rpc("check_in_booking", {
    p_booking_number: bookingNumber.trim(),
    p_whatsapp: whatsapp.trim(),
  });
  if (error) {
    if (error.message?.includes("NOT_FOUND")) {
      return { ok: false, error: "Nomor booking tidak ditemukan." };
    }
    if (error.message?.includes("CONTACT_MISMATCH")) {
      return { ok: false, error: "Nomor WhatsApp tidak sesuai dengan data booking." };
    }
    if (error.message?.includes("NOT_PAID")) {
      return { ok: false, error: "Booking ini belum dibayar — verifikasi pembayaran dahulu." };
    }
    return { ok: false, error: "Gagal memproses check-in." };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    customerFullName: row.customer_full_name,
    sessionDate: row.session_date,
    startTime: row.start_time,
    alreadyCheckedIn: row.already_checked_in,
  };
}
