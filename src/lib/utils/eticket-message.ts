import type { AdminBookingRow } from "@/lib/services/admin";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatTimeRange } from "@/lib/utils/format";

/** Message templates for sending an e-ticket; edited in Admin -> Konten Website -> Pesan e-ticket. */
export interface ETicketTemplates {
  waMessage: string;
  emailSubject: string;
  emailBody: string;
}

/** Replaces {nama}, {booking}, {link}, {jadwal}, {kursi} and {jumlah} in a template. */
export function fillETicketTemplate(template: string, b: AdminBookingRow, link: string) {
  const values: Record<string, string> = {
    nama: b.customerName,
    booking: b.bookingNumber,
    link,
    jadwal: `${formatWeekday(b.sessionDate)}, ${formatDate(b.sessionDate)}, ${formatTimeRange(b.startTime, b.endTime)}`,
    kursi: b.seatLabels?.length ? `No. ${b.seatLabels.join(", ")}` : `${b.seats} orang`,
    jumlah: `${b.seats} orang`,
  };
  return template.replace(/\{(nama|booking|link|jadwal|kursi|jumlah)\}/g, (_, key: string) => values[key] ?? "");
}
