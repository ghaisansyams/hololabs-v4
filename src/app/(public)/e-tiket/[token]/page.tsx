import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock, Printer, Users } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { PrintButton } from "@/components/ticket/print-button";
import { getBookingByToken } from "@/lib/services/booking";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatTimeRange } from "@/lib/utils/format";
import { qrDataUrl } from "@/lib/utils/qr";

export const metadata: Metadata = { title: "E-Tiket" };

export default async function ETicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  if (booking.paymentStatus !== "PAID") {
    redirect(`/pembayaran/${token}`);
  }

  const qr = await qrDataUrl(booking.bookingNumber);

  return (
    <Container as="section" className="max-w-xl py-10 sm:py-14">
      <div className="print-area mx-auto overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-lift">
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-dark to-accent-dark px-6 py-5">
          <LogoMark className="size-9" />
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1 text-xs font-bold text-white">
            <CheckCircle2 className="size-3.5" aria-hidden />
            {booking.checkinStatus === "CHECKED_IN" ? "Sudah Check-in" : "Tiket Aktif"}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Nomor Booking</p>
          <p className="mt-1 text-xl font-extrabold text-ink font-display">{booking.bookingNumber}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-y border-dashed border-line py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tanggal</p>
              <p className="mt-1 text-sm font-bold text-ink">{formatWeekday(booking.sessionDate)}</p>
              <p className="text-sm text-ink-soft">{formatDate(booking.sessionDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sesi</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink">
                <Clock className="size-3.5 text-accent" aria-hidden />
                {formatTimeRange(booking.startTime, booking.endTime)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Paket</p>
              <p className="mt-1 text-sm font-bold text-ink">{booking.packageName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kursi</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink">
                <Users className="size-3.5 text-accent" aria-hidden />
                {booking.seats} orang
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <Image
              src={qr}
              alt={`QR check-in untuk ${booking.bookingNumber}`}
              width={200}
              height={200}
              className="rounded-xl border border-line bg-white p-2"
              unoptimized
            />
            <p className="text-xs text-muted">Tunjukkan QR ini atau nomor booking di atas saat check-in.</p>
          </div>

          <div className="mt-6 border-t border-line pt-4 text-sm text-ink-soft">
            <p>
              Atas nama <span className="font-semibold text-ink">{booking.customerFullName}</span>
            </p>
          </div>
        </div>
      </div>

      <PrintButton className="mt-6 w-full">
        <Printer className="size-4" aria-hidden />
        Cetak / Simpan sebagai PDF
      </PrintButton>
    </Container>
  );
}
