"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cancelBookingByToken, submitPaymentProof } from "@/lib/services/payment";
import { emailConfigured, sendVerificationEmail } from "@/lib/services/mailer";
import { getBookingByToken } from "@/lib/services/booking";

/** Guest taps "Saya Sudah Transfer" — no WhatsApp handoff, confirmed later by an admin. */
export async function confirmTransfer(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const senderName = String(formData.get("senderName") ?? "").trim().slice(0, 80);

  const result = await submitPaymentProof(token, senderName || null);
  revalidatePath(`/pembayaran/${token}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  if (!result.ok) {
    redirect(`/pembayaran/${token}?error=${encodeURIComponent(result.error)}`);
  }
  // "sedang diverifikasi" email; a failed send must never block the guest
  if (emailConfigured()) {
    try {
      const booking = await getBookingByToken(token);
      if (booking) await sendVerificationEmail(booking.bookingId);
    } catch {
      /* the page already confirms the transfer was reported */
    }
  }
  redirect(`/pembayaran/${token}?submitted=1`);
}

/** "Batalkan pesanan": releases the seats while no transfer has been reported yet. */
export async function cancelOrder(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const result = await cancelBookingByToken(token);
  revalidatePath(`/pembayaran/${token}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  if (!result.ok) {
    redirect(`/pembayaran/${token}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/pembayaran/${token}`);
}
