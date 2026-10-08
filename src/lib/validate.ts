/**
 * Validasi bersama — PRD bagian 8.
 *
 * Dipakai ulang di server. Validasi di browser hanya untuk kenyamanan;
 * yang menentukan adalah pemeriksaan di sini (PRD bagian 11).
 */

export type Errors = Record<string, string>;

const WA = /^(\+?62|0)8[1-9][0-9]{6,11}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Menormalkan nomor Indonesia ke bentuk +62 supaya satu orang = satu nomor. */
export function normalizeWhatsapp(raw: string): string {
  const digits = (raw ?? "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+62")) return digits;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return digits;
}

function notPast(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value) >= today;
}

export function validateInquiry(data: Record<string, unknown>): Errors {
  const errors: Errors = {};
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const whatsapp = String(data.whatsapp ?? "");
  const message = String(data.message ?? "").trim();
  const services = Array.isArray(data.services) ? data.services : [];
  const budget = String(data.budget ?? "");
  const eventDate = String(data.eventDate ?? "");
  const company = String(data.company ?? "");

  if (name.length < 3 || name.length > 80) errors.name = "Nama 3–80 karakter.";
  if (company.length > 100) errors.company = "Nama perusahaan maksimal 100 karakter.";
  if (!EMAIL.test(email)) errors.email = "Format email tidak valid.";
  if (!WA.test(whatsapp.replace(/[\s-]/g, ""))) errors.whatsapp = "Nomor WhatsApp tidak valid.";
  if (services.length === 0) errors.services = "Pilih minimal satu layanan.";
  if (!budget) errors.budget = "Pilih rentang budget.";
  if (message.length < 20 || message.length > 1000) {
    errors.message = "Deskripsi kebutuhan 20–1000 karakter.";
  }
  if (eventDate && !notPast(eventDate)) errors.eventDate = "Tanggal acara sudah lewat.";

  return errors;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pemesanan show: sesi + paket F&B + jumlah kursi (maks. 13 per show),
 * disamakan dengan hololabs-id. Keberadaan sesi dan paket, serta harga,
 * diperiksa ulang oleh fungsi create_show_booking di basis data.
 */
export function validateReservation(data: Record<string, unknown>): Errors {
  const errors: Errors = {};
  const name = String(data.name ?? "").trim();
  const whatsapp = String(data.whatsapp ?? "");
  const email = String(data.email ?? "").trim();
  const seats = Number(data.seats);
  const sessionId = String(data.sessionId ?? "");
  const packageId = String(data.packageId ?? "");
  const note = String(data.note ?? "");

  if (!UUID.test(sessionId)) errors.sessionId = "Pilih tanggal dan sesi terlebih dahulu.";
  if (!packageId) errors.packageId = "Pilih paket F&B terlebih dahulu.";
  if (!Number.isInteger(seats) || seats < 1 || seats > 13) {
    errors.seats = "Jumlah kursi harus antara 1 dan 13.";
  }
  if (name.length < 3 || name.length > 80) errors.name = "Nama minimal 3 karakter.";
  if (!WA.test(whatsapp.replace(/[\s-]/g, ""))) {
    errors.whatsapp = "Gunakan format nomor Indonesia, contoh 08123456789.";
  }
  if (email && !EMAIL.test(email)) errors.email = "Masukkan alamat email yang valid, atau kosongkan.";
  if (note.length > 500) errors.note = "Catatan maksimal 500 karakter.";

  return errors;
}

/** Kode booking yang mudah dibacakan lewat telepon: tanpa 0, O, 1, I. */
export function bookingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `HL-${code}`;
}
