"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MAX_PROOF_BYTES, submitPaymentProof } from "@/lib/services/payment";

/** Guest taps "Saya Sudah Transfer" — no WhatsApp handoff, confirmed later by an admin. */
export async function confirmTransfer(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const file = formData.get("proof");

  let proofDataUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      redirect(`/pembayaran/${token}?error=${encodeURIComponent("Bukti transfer harus berupa gambar (JPG/PNG).")}`);
    }
    if (file.size > MAX_PROOF_BYTES) {
      redirect(`/pembayaran/${token}?error=${encodeURIComponent("Ukuran gambar maksimal 3 MB.")}`);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    proofDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  }

  const result = await submitPaymentProof(token, proofDataUrl);
  revalidatePath(`/pembayaran/${token}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  if (!result.ok) {
    redirect(`/pembayaran/${token}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/pembayaran/${token}?submitted=1`);
}
