"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cancelBookingByToken, submitPaymentProof } from "@/lib/services/payment";
import { emailConfigured, sendVerificationEmail } from "@/lib/services/mailer";
import { getBookingByToken } from "@/lib/services/booking";
import { logActivity } from "@/lib/services/activity-log";

/** Guest taps "Saya Sudah Transfer" — no WhatsApp handoff, confirmed later by an admin. */
export async function confirmTransfer(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const senderName = String(formData.get("senderName") ?? "").trim().slice(0, 80);

  const result = await submitPaymentProof(token, senderName || null);
  if (result.ok) {
    const info = await getBookingByToken(token).catch(() => null);
    await logActivity({ category: "Pelanggan", actor: "pelanggan", action: "Pelanggan lapor sudah transfer", target: info?.bookingNumber ?? "", detail: senderName ? `Nama pengirim: ${senderName}` : "" });
  }
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
  const info = await getBookingByToken(token).catch(() => null);
  const result = await cancelBookingByToken(token);
  if (result.ok) await logActivity({ category: "Pelanggan", actor: "pelanggan", action: "Pelanggan batalkan pesanan", target: info?.bookingNumber ?? "" });
  revalidatePath(`/pembayaran/${token}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  if (!result.ok) {
    redirect(`/pembayaran/${token}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/pembayaran/${token}`);
}
