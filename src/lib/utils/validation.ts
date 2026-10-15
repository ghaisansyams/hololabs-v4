export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Indonesian mobile numbers: 08xx / +628xx / 628xx. */
const PHONE = /^(\+?62|0)8[1-9][0-9]{6,11}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

export function isEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export function isPhone(value: string): boolean {
  return PHONE.test(normalizePhone(value));
}

/* ------------------------------------------------------------------ */
/* Booking contact form                                                */
/* ------------------------------------------------------------------ */

export interface ContactFormValues {
  fullName: string;
  whatsapp: string;
  email: string;
}

export const emptyContact: ContactFormValues = {
  fullName: "",
  whatsapp: "",
  email: "",
};

export function validateContact(values: ContactFormValues): FieldErrors<ContactFormValues> {
  const errors: FieldErrors<ContactFormValues> = {};
  if (values.fullName.trim().length < 3) {
    errors.fullName = "Nama minimal 3 karakter.";
  }
  if (!isPhone(values.whatsapp)) {
    errors.whatsapp = "Gunakan format nomor Indonesia, contoh 08123456789.";
  }
  if (values.email.trim() !== "" && !isEmail(values.email)) {
    errors.email = "Masukkan alamat email yang valid, atau kosongkan.";
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Check-in at the door                                                */
/* ------------------------------------------------------------------ */

export interface CheckInFormValues {
  bookingNumber: string;
  whatsapp: string;
}

export function validateCheckIn(values: CheckInFormValues): FieldErrors<CheckInFormValues> {
  const errors: FieldErrors<CheckInFormValues> = {};
  if (values.bookingNumber.trim().length < 6) {
    errors.bookingNumber = "Masukkan nomor booking, contoh HLM-BOOK-2026-00001.";
  }
  if (!isPhone(values.whatsapp)) {
    errors.whatsapp = "Masukkan nomor WhatsApp yang dipakai saat memesan.";
  }
  return errors;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
