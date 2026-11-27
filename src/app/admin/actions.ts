"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db/client";
import {
  ADMIN_COOKIE,
  SESSION_HOURS,
  createSessionToken,
  credentialsMatch,
} from "@/lib/admin/session";
import { findBookingByNumber, getBookingById } from "@/lib/services/admin";
import { sendBookingChangeEmail, sendETicketEmail } from "@/lib/services/mailer";
import {
  listEditableSessions,
  deleteBookingRecord,
  takenSeatsExcluding,
  updateBookingShow,
  type EditableSession,
} from "@/lib/services/booking-edit";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity, rp } from "@/lib/services/activity-log";
import { formatDayMonth } from "@/lib/utils/date";


/** "HLM-BOOK-… · Nama": how a booking appears in the activity log. */
async function bookingInfo(id: string): Promise<{ number: string; name: string }> {
  const b = await getBookingById(id).catch(() => null);
  return { number: b?.bookingNumber ?? id, name: b?.customerName ?? "" };
}

const showText = (b: { sessionDate: string; startTime: string; endTime: string }) =>
  `${formatDayMonth(b.sessionDate)} ${b.sessionDate.slice(0, 4)} ${b.startTime.slice(0, 5)}-${b.endTime.slice(0, 5)}`;
const seatsText = (labels: string[] | null | undefined, count: number) => (labels?.length ? `No. ${labels.join(", ")}` : `${count} kursi`);

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!(await credentialsMatch(username, password))) {
    await logActivity({ category: "Login", action: "Login gagal", actor: username.slice(0, 40) || "-", detail: "Username atau password salah" });
    return { error: "Username atau password salah." };
  }
  await logActivity({ category: "Login", action: "Login berhasil", actor: username.slice(0, 40) || "admin" });
  const token = await createSessionToken();
  // Flag "Secure" hanya bila koneksinya benar-benar HTTPS. Di HTTP biasa
  // (localhost / IP LAN) browser menolak cookie Secure, sehingga login
  // terlihat berhasil sesaat lalu minta isi ulang di setiap klik.
  const h = await headers();
  const viaHttps =
    (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https" ||
    (h.get("origin") ?? "").startsWith("https://");
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: viaHttps,
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_HOURS * 60 * 60,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await logActivity({ category: "Login", action: "Logout" });
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

export async function markBookingPaid(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  await rows(sql`select admin_mark_paid(${id}::uuid)`);
  const info = await bookingInfo(id);
  await logActivity({ category: "Pembayaran", action: "Tandai lunas", target: info.number, detail: info.name });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export interface ConfirmPaidResult {
  ok: boolean;
  error?: string;
  /** "sent": the e-ticket email went out; "failed": paid, but the email did not (see emailError); "skipped": the guest left no email. */
  email?: "sent" | "failed" | "skipped";
  emailError?: string;
}

/**
 * Marks a booking paid and emails the guest their e-ticket and check-in QR
 * straight away. The list is not refreshed, so the confirm dialog can show
 * the result (and a retry button when the email failed) even if the row
 * leaves the current filter; the dialog refreshes the page when it closes.
 */
export async function confirmBookingPaid(bookingId: string): Promise<ConfirmPaidResult> {
  await requireAdmin();
  try {
    await rows(sql`select admin_mark_paid(${bookingId}::uuid)`);
  } catch {
    return { ok: false, error: "Gagal menandai lunas. Muat ulang halaman lalu coba lagi." };
  }
  const booking = await getBookingById(bookingId);
  if (!booking?.email) {
    await logActivity({ category: "Pembayaran", action: "Tandai lunas", target: booking?.bookingNumber ?? bookingId, detail: `${booking?.customerName ?? ""}. Tamu tidak mengisi email, e-ticket tidak dikirim.` });
    return { ok: true, email: "skipped" };
  }
  const sent = await sendETicketEmail(bookingId);
  await logActivity({
    category: "Pembayaran",
    action: "Tandai lunas",
    target: booking.bookingNumber,
    detail: `${booking.customerName}. E-ticket ${sent.ok ? `terkirim ke ${booking.email}` : `gagal terkirim: ${sent.error}`}`,
  });
  return sent.ok ? { ok: true, email: "sent" } : { ok: true, email: "failed", emailError: sent.error };
}

/** Sends (or re-sends) the e-ticket email of a paid booking. */
export async function resendETicketEmail(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const result = await sendETicketEmail(bookingId);
  const info = await bookingInfo(bookingId);
  await logActivity({ category: "Email", action: "Kirim ulang e-ticket", target: info.number, detail: `${info.name}. ${result.ok ? "Terkirim" : `Gagal: ${result.error}`}` });
  revalidatePath("/admin/bookings");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Shows an admin can move an order to (for the "Ubah pesanan" dialog). */
export async function loadEditableSessions(bookingId: string): Promise<EditableSession[]> {
  await requireAdmin();
  return listEditableSessions(bookingId);
}

/** Seats other orders already hold in a show, so the dialog can grey them out. */
export async function loadTakenSeats(bookingId: string, sessionId: string): Promise<string[]> {
  await requireAdmin();
  return takenSeatsExcluding(sessionId, bookingId);
}

/**
 * Saves a new show and/or seats for an order. The guest is NOT emailed: the
 * order is flagged and "Kirim email perubahan" in the Aksi column sends it.
 */
export type SaveChangeResult =
  | {
      ok: true;
      amount: number;
      previousAmount: number;
      changed: boolean;
      /** The guest is emailed as part of saving; `error` is set when that send failed (the change itself is saved). */
      email: { sent: boolean; to: string; error?: string };
    }
  | { ok: false; error: string };

/** Saves the new show/seats, then emails the guest the "perubahan pesanan" notice right away. */
export async function saveBookingChange(bookingId: string, sessionId: string, seats: string[]): Promise<SaveChangeResult> {
  await requireAdmin();
  const before = await getBookingById(bookingId).catch(() => null);
  const result = await updateBookingShow(bookingId, sessionId, seats);
  if (!result.ok) return result;
  let email: { sent: boolean; to: string; error?: string } = { sent: false, to: "" };
  if (result.changed) {
    const mail = await sendBookingChangeEmail(bookingId);
    const after = await getBookingById(bookingId);
    email = { sent: mail.ok, to: after?.email ?? "", ...(mail.ok ? {} : { error: mail.error }) };
    await logActivity({
      category: "Booking",
      action: "Reschedule / ubah pesanan",
      target: after?.bookingNumber ?? bookingId,
      detail: [
        after?.customerName ?? "",
        before && after ? `Jadwal: ${showText(before)} → ${showText(after)}` : "",
        before && after ? `Kursi: ${seatsText(before.seatLabels, before.seats)} → ${seatsText(after.seatLabels, after.seats)}` : "",
        `Total: ${rp(result.previousAmount)} → ${rp(result.amount)}`,
        `Email perubahan ${mail.ok ? `terkirim ke ${after?.email}` : `gagal: ${mail.error}`}`,
      ]
        .filter(Boolean)
        .join(". "),
    });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/sessions");
  return { ...result, email };
}

/** Retry for the "perubahan pesanan" email when the automatic send after saving failed. */
export async function sendChangeEmail(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const result = await sendBookingChangeEmail(bookingId);
  const info = await bookingInfo(bookingId);
  await logActivity({ category: "Email", action: "Kirim ulang email perubahan", target: info.number, detail: `${info.name}. ${result.ok ? "Terkirim" : `Gagal: ${result.error}`}` });
  revalidatePath("/admin/bookings");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function cancelBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  const info = await bookingInfo(id);
  await rows(sql`select admin_cancel_booking(${id}::uuid)`);
  await logActivity({ category: "Booking", action: "Batalkan booking", target: info.number, detail: info.name });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/sessions");
}

export async function deleteBooking(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const b = await getBookingById(id).catch(() => null);
  if (!b) return { ok: false, error: "Data peserta tidak ditemukan, mungkin sudah dihapus." };
  const res = await deleteBookingRecord(id);
  if (!res.ok) return { ok: false, error: res.error };
  await logActivity({
    category: "Booking",
    action: "Hapus data peserta",
    target: b.bookingNumber,
    detail: `${b.customerName} · ${showText(b)} · ${seatsText(b.seatLabels, b.seats)} · ${rp(b.amount)} · status ${b.status === "CANCELLED" ? "dibatalkan" : b.paymentStatus === "PAID" ? "lunas" : "belum lunas"}${res.customerRemoved ? " · data pelanggan ikut dihapus" : ""}`,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function checkInBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  await rows(sql`select admin_check_in(${id}::uuid)`);
  const info = await bookingInfo(id);
  await logActivity({ category: "Booking", action: "Check-in", target: info.number, detail: info.name });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export interface CheckInLookupState {
  error?: string;
  success?: string;
}

export async function checkInByNumber(
  _prev: CheckInLookupState,
  formData: FormData,
): Promise<CheckInLookupState> {
  await requireAdmin();
  const bookingNumber = String(formData.get("bookingNumber") ?? "");
  const booking = await findBookingByNumber(bookingNumber);
  if (!booking) return { error: "Nomor booking tidak ditemukan." };
  if (booking.status === "CANCELLED") return { error: "Booking ini sudah dibatalkan." };
  if (booking.paymentStatus !== "PAID") return { error: "Booking ini belum lunas — verifikasi pembayaran dulu." };
  if (booking.checkinStatus === "CHECKED_IN") return { error: `${booking.customerName} (${booking.bookingNumber}) sudah check-in sebelumnya.` };

  try {
    await rows(sql`select admin_check_in(${booking.id}::uuid)`);
  } catch {
    return { error: "Gagal check-in. Coba lagi." };
  }
  await logActivity({ category: "Booking", action: "Check-in (input nomor)", target: booking.bookingNumber, detail: booking.customerName });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return {
    success: `${booking.customerName} — ${booking.seats} kursi, sesi ${booking.sessionDate} ${booking.startTime.slice(0, 5)} berhasil check-in.`,
  };
}
