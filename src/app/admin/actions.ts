"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSql } from "@/lib/db/client";
import {
  ADMIN_COOKIE,
  SESSION_HOURS,
  createSessionToken,
  isValidSessionToken,
  passwordMatches,
} from "@/lib/admin/session";
import { findBookingByNumber } from "@/lib/services/admin";

async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await isValidSessionToken(token))) redirect("/admin/login");
}

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!(await passwordMatches(password))) {
    return { error: "Password salah." };
  }
  const token = await createSessionToken();
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
  const sql = getSql();
  await sql`select admin_mark_paid(${id}::uuid)`;
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export async function cancelBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  const sql = getSql();
  await sql`select admin_cancel_booking(${id}::uuid)`;
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/sessions");
}

export async function checkInBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  const sql = getSql();
  await sql`select admin_check_in(${id}::uuid)`;
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

  try {
    await getSql()`select admin_check_in(${booking.id}::uuid)`;
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
  if (!name || !Number.isFinite(price) || price < 0) return;

  const sql = getSql();
  await sql`
    update packages set name = ${name}, description = ${description}, price = ${price}, active = ${active}
    where id = ${id}
  `;
  revalidatePath("/admin/packages");
  revalidatePath("/pesan");
  revalidatePath("/");
}
