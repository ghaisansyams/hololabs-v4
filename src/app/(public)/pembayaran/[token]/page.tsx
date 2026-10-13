import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Clock3, Info, Landmark, Send } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getBookingByToken } from "@/lib/services/booking";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { paymentAccounts } from "@/data/payment-accounts";
import { confirmTransfer } from "./actions";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { token } = await params;
  const { submitted, error } = await searchParams;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  if (booking.paymentStatus === "PAID") {
    redirect(`/e-tiket/${token}`);
  }
  const awaitingConfirmation = booking.paymentStatus === "SUBMITTED";

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

      {awaitingConfirmation ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
          <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden />
          Menunggu konfirmasi — kami sudah menerima konfirmasi transfermu. Admin akan memverifikasi
          dan mengaktifkan tiketmu, biasanya tidak lama.
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {submitted && !error ? (
        <p className="mt-4 rounded-2xl border border-success/40 bg-success-soft px-4 py-3 text-sm text-success">
          Konfirmasi transfer diterima. Statusmu sekarang menunggu konfirmasi admin.
        </p>
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

      <div className="mt-6 rounded-card border border-line bg-surface p-6">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Transfer ke salah satu rekening</span>
        <div className="mt-4 space-y-3">
          {paymentAccounts.map((account) => (
            <div
              key={account.bank}
              className="flex items-center gap-3 rounded-2xl border border-line bg-canvas-deep px-4 py-3"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-canvas">
                <Landmark className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">{account.bank}</p>
                <p className="truncate font-mono text-base font-bold text-ink">{account.accountNumber}</p>
                <p className="text-xs text-ink-soft">a.n. {account.accountName}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Demo pembayaran — rekening di atas belum terhubung ke payment gateway resmi. Setelah
          transfer sejumlah yang tertera, tekan tombol di bawah agar admin tahu untuk memeriksa dan
          mengaktifkan tiketmu.
        </p>
      </div>

      {!awaitingConfirmation ? (
        <form action={confirmTransfer}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className={buttonStyles({ size: "lg", className: "mt-6 w-full" })}>
            <Send className="size-4" aria-hidden />
            Saya Sudah Transfer
          </button>
        </form>
      ) : null}

      <Link href={`/e-tiket/${token}`} className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-3 w-full" })}>
        Cek Status Tiket
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Container>
  );
}
