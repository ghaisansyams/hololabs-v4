"use server";

import { redirect } from "next/navigation";
import { createBooking } from "@/lib/services/booking";
import { hasErrors, validateContact, type ContactFormValues, type FieldErrors } from "@/lib/utils/validation";

export interface BookingFormState {
  error?: string;
  fieldErrors?: FieldErrors<ContactFormValues>;
}

export async function submitBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  const seats = Number(formData.get("seats") ?? 0);
  const unitPrice = Number(formData.get("unitPrice") ?? 0);

  const contact: ContactFormValues = {
    fullName: String(formData.get("fullName") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  if (!sessionId) {
    return { error: "Pilih tanggal dan sesi terlebih dahulu." };
  }
  if (!packageId) {
    return { error: "Pilih paket F&B terlebih dahulu." };
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 13) {
    return { error: "Jumlah kursi harus antara 1 dan 13." };
  }

  const fieldErrors = validateContact(contact);
  if (hasErrors(fieldErrors)) {
    return { fieldErrors };
  }

  const result = await createBooking({ sessionId, packageId, seats, unitPrice, contact });
  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/pembayaran/${result.accessToken}`);
}
