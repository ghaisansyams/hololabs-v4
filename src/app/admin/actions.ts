"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, like, or, sql } from "drizzle-orm";
import { getDb, rows, schema } from "@/lib/db/client";
import {
  ADMIN_COOKIE,
  SESSION_HOURS,
  createSessionToken,
  credentialsMatch,
} from "@/lib/admin/session";
import { findBookingByNumber, getBookingById } from "@/lib/services/admin";
import { sendETicketEmail } from "@/lib/services/mailer";
import { requireAdmin } from "@/lib/admin/guard";


export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!(await credentialsMatch(username, password))) {
    return { error: "Username atau password salah." };
  }
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
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

export async function markBookingPaid(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  await rows(sql`select admin_mark_paid(${id}::uuid)`);
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
  if (!booking?.email) return { ok: true, email: "skipped" };
  const sent = await sendETicketEmail(bookingId);
  return sent.ok ? { ok: true, email: "sent" } : { ok: true, email: "failed", emailError: sent.error };
}

/** Sends (or re-sends) the e-ticket email of a paid booking. */
export async function resendETicketEmail(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const result = await sendETicketEmail(bookingId);
  revalidatePath("/admin/bookings");
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function cancelBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  await rows(sql`select admin_cancel_booking(${id}::uuid)`);
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/sessions");
}

export async function checkInBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  await rows(sql`select admin_check_in(${id}::uuid)`);
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
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return {
    success: `${booking.customerName} — ${booking.seats} kursi, sesi ${booking.sessionDate} ${booking.startTime.slice(0, 5)} berhasil check-in.`,
  };
}

export async function updatePackage(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("packageId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const active = formData.get("active") === "on";
  const includes = readIncludes(formData);
  if (!name || !Number.isFinite(price) || price < 0) return;

  await getDb()
    .update(schema.packages)
    .set({ name, description, price: String(price), active, includes })
    .where(eq(schema.packages.id, id));
  revalidatePath("/admin/packages");
  revalidatePath("/booking");
  revalidatePath("/");
}

/**
 * Hapus paket permanen. Hanya boleh bila belum pernah dipesan (booking
 * menyimpan referensi ke paket); kalau sudah pernah, paket tetap ada dan admin
 * diarahkan untuk menonaktifkannya saja.
 */
export async function deletePackage(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("packageId") ?? "");
  if (!id) redirect("/admin/packages");

  const db = getDb();
  const [used] = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(eq(schema.bookings.packageId, id))
    .limit(1);
  if (used) redirect("/admin/packages?notice=used");

  try {
    await db.delete(schema.packages).where(eq(schema.packages.id, id));
  } catch {
    // Pemesanan masuk tepat saat dihapus: FK menolak, perlakukan sebagai "sudah dipakai".
    redirect("/admin/packages?notice=used");
  }
  revalidatePath("/admin/packages");
  revalidatePath("/booking");
  revalidatePath("/");
  redirect("/admin/packages?notice=deleted");
}

/** Bullet points, one per line in the form. */
function readIncludes(formData: FormData): string[] {
  return String(formData.get("includes") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function createPackage(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  if (!name || !Number.isFinite(price) || price < 0) return;

  // Package ids are stable slugs (bookings reference them); add a suffix
  // if the name's slug is already taken.
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "paket";
  const { packages } = schema;
  const db = getDb();
  const taken = await db
    .select({ id: packages.id })
    .from(packages)
    .where(or(eq(packages.id, base), like(packages.id, `${base}-%`)));
  const id = taken.length === 0 ? base : `${base}-${taken.length + 1}`;
  await db.insert(packages).values({
    id,
    name,
    description,
    includes: readIncludes(formData),
    price: String(price),
    sortOrder: sql`(select coalesce(max(sort_order), 0) + 1 from packages)`,
    active: true,
  });
  revalidatePath("/admin/packages");
  revalidatePath("/booking");
  revalidatePath("/");
}
