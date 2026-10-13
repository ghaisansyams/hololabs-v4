"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { submitPaymentProof } from "@/lib/services/payment";

/** Guest taps "Saya Sudah Transfer" — no WhatsApp handoff, confirmed later by an admin. */
export async function confirmTransfer(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const result = await submitPaymentProof(token);
  revalidatePath(`/pembayaran/${token}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  if (!result.ok) {
    redirect(`/pembayaran/${token}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/pembayaran/${token}?submitted=1`);
}
