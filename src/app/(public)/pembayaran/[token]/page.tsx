import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Info, MessageCircle } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getBookingByToken } from "@/lib/services/booking";
import { buildQrisPayload, buildWhatsappConfirmationLink } from "@/lib/services/payment";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { qrDataUrl } from "@/lib/utils/qr";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  if (booking.paymentStatus === "PAID") {
    redirect(`/e-tiket/${token}`);
  }

  const qris = await qrDataUrl(buildQrisPayload(booking.bookingNumber, booking.amount));
  const waLink = buildWhatsappConfirmationLink(booking.bookingNumber, booking.amount);

  return (
    <Container as="section" className="max-w-xl py-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-wide text-accent">Booking {booking.bookingNumber}</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">Selesaikan pembayaran</h1>

      {booking.autoRouted ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Sesi pilihanmu sudah penuh — booking ini otomatis dipindahkan ke sesi terdekat yang masih
          tersedia, tanggal dan jam di bawah ini sudah yang baru.
        </div>
      ) : null}

      <div className="mt-6 rounded-card border border-line bg-surface p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Sesi</dt>
            <dd className="text-right font-semibold text-ink">
              {formatWeekday(booking.sessionDate)}, {formatDate(booking.sessionDate)}
              <br />
              {formatTimeRange(booking.startTime, booking.endTime)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Paket</dt>
            <dd className="font-semibold text-ink">{booking.packageName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Kursi</dt>
            <dd className="font-semibold text-ink">{booking.seats}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-semibold text-ink-soft">Total bayar</span>
          <span className="text-2xl font-extrabold text-ink font-display">{formatRupiah(booking.amount)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center rounded-card border border-line bg-surface p-6 text-center">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Scan QRIS untuk membayar</span>
        <Image src={qris} alt={`Kode QRIS untuk booking ${booking.bookingNumber}`} width={220} height={220} className="mt-4 rounded-xl border border-line bg-white p-3" unoptimized />
        <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted">
          Demo pembayaran — belum terhubung ke payment gateway QRIS resmi. Setelah membayar, kirim
          bukti transfer lewat WhatsApp agar admin dapat memverifikasi dan mengaktifkan tiketmu.
        </p>
      </div>

      <a href={waLink} target="_blank" rel="noopener noreferrer" className={buttonStyles({ size: "lg", className: "mt-6 w-full" })}>
        <MessageCircle className="size-4" aria-hidden />
        Saya Sudah Bayar — Kirim Bukti
      </a>

      <Link href={`/e-tiket/${token}`} className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-3 w-full" })}>
        Cek Status Tiket
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Container>
  );
}
