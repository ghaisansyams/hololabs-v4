import type { AdminBookingRow } from "@/lib/services/admin";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";

/**
 * Admin's own outbound message drafts — staff messaging a guest from
 * /admin/bookings, not a guest-facing payment flow (which never hands off
 * to WhatsApp; see submit_payment_proof in db/schema.sql).
 */
export interface WaTemplate {
  key: string;
  label: string;
  build: (b: AdminBookingRow) => string;
}

const sesi = (b: AdminBookingRow) =>
  `${formatWeekday(b.sessionDate)}, ${formatDate(b.sessionDate)} pukul ${formatTimeRange(b.startTime, b.endTime)} WIB`;

export const waTemplates: WaTemplate[] = [
  {
    key: "konfirmasi",
    label: "Konfirmasi pembayaran",
    build: (b) =>
      `Halo Kak ${b.customerName}! 👋\n\nPembayaran untuk booking *${b.bookingNumber}* (${b.packageName}, ${b.seats} kursi, ${formatRupiah(b.amount)}) sudah kami terima dan tiketmu sekarang aktif.\n\nSesi: ${sesi(b)}.\n\nSampai ketemu di Hololabs!`,
  },
  {
    key: "reminder",
    label: "Reminder H-1",
    build: (b) =>
      `Halo Kak ${b.customerName}, pengingat untuk show kamu besok ya 🎟️\n\nBooking: *${b.bookingNumber}*\nSesi: ${sesi(b)}\nJumlah: ${b.seats} kursi — ${b.packageName}\n\nMohon hadir 15 menit sebelum jadwal. Sampai jumpa besok!`,
  },
  {
    key: "lokasi",
    label: "Info lokasi venue",
    build: (b) =>
      `Halo Kak ${b.customerName}, berikut info lokasi untuk booking *${b.bookingNumber}*:\n\nSesi: ${sesi(b)}\n\nSilakan datang ke venue Hololabs Exhibition sesuai jadwal di atas. Tunjukkan nomor booking atau e-tiket di meja registrasi ya. Sampai jumpa!`,
  },
  {
    key: "pembatalan",
    label: "Pembatalan",
    build: (b) =>
      `Halo Kak ${b.customerName}, booking *${b.bookingNumber}* (${sesi(b)}) sudah kami batalkan sesuai permintaan/kondisi yang berlaku. Kursi sudah dikembalikan ke sistem.\n\nKalau ada pertanyaan, silakan balas pesan ini ya. Terima kasih 🙏`,
  },
];
