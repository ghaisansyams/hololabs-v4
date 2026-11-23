"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MAX_PROOF_BYTES, cancelBookingByToken, submitPaymentProof } from "@/lib/services/payment";
import { sniffImage } from "@/lib/utils/image";

/** Guest taps "Saya Sudah Transfer" — no WhatsApp handoff, confirmed later by an admin. */
export async function confirmTransfer(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const file = formData.get("proof");
  const senderName = String(formData.get("senderName") ?? "").trim().slice(0, 80);

  let proofDataUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PROOF_BYTES) {
      redirect(`/pembayaran/${token}?error=${encodeURIComponent("Ukuran gambar maksimal 3 MB.")}`);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    // The type comes from the file's own bytes, not from what the browser claims.
    const type = sniffImage(buffer);
    if (!type) {
      redirect(`/pembayaran/${token}?error=${encodeURIComponent("Bukti transfer harus berupa gambar (JPG, PNG, WebP, atau GIF).")}`);
    }
    proofDataUrl = `data:${type};base64,${buffer.toString("base64")}`;
  }

  const result = await submitPaymentProof(token, proofDataUrl, senderName || null);
  revalidatePath(`/pembayaran/${token}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  if (!result.ok) {
    redirect(`/pembayaran/${token}?error=${encodeURIComponent(result.error)}`);
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
