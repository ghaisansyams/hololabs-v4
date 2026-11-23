"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, X } from "lucide-react";
import { confirmBookingPaid } from "@/app/admin/actions";
import { TicketDelivery } from "@/components/admin/ticket-delivery";
import type { AdminBookingRow } from "@/lib/services/admin";
import type { ETicketTemplates } from "@/lib/utils/eticket-message";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Confirm a transfer, then send the e-ticket, in one dialog (the pattern of
 * the Kelas Bermain admin): "Konfirmasi" opens a summary with the proof and
 * the exact amount to look for in the bank account; confirming marks the
 * booking paid and the same dialog moves on to the WhatsApp / Gmail buttons.
 * For bookings that are already paid it opens straight on the send step.
 * The list refreshes when the dialog closes, so a row that leaves the
 * current filter does not vanish mid-way.
 */
export function PaymentFlowDialog({
  booking,
  templates,
  className,
}: {
  booking: AdminBookingRow;
  templates: ETicketTemplates;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(booking.paymentStatus === "PAID");
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const wasPaid = booking.paymentStatus === "PAID";
  const unsent = !booking.ticketSentWaAt && !booking.ticketSentEmailAt;

  function close() {
    if (pending) return;
    setOpen(false);
    setError("");
    router.refresh();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        setOpen(false);
        router.refresh();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, router]);

  async function confirm() {
    setPending(true);
    setError("");
    const res = await confirmBookingPaid(booking.id);
    setPending(false);
    if (res.ok) {
      setPaid(true);
      setJustConfirmed(true);
    } else {
      setError(res.error ?? "Gagal menandai lunas.");
    }
  }

  const triggerLabel = wasPaid ? (unsent ? "Kirim e-ticket" : "Kirim ulang") : booking.paymentStatus === "SUBMITTED" ? "Konfirmasi" : "Tandai lunas";
  const primary = !wasPaid || unsent;

  const rows: [string, string][] = [
    ["Pemesan", booking.customerName],
    ["Jadwal", `${formatWeekday(booking.sessionDate)}, ${formatDate(booking.sessionDate)} · ${formatTimeRange(booking.startTime, booking.endTime)}`],
    ["Kursi", booking.seatLabels?.length ? `No. ${booking.seatLabels.join(", ")} (${booking.seats})` : `${booking.seats} kursi`],
    ...(booking.senderName ? ([["Nama pengirim", booking.senderName]] as [string, string][]) : []),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition",
          primary
            ? "bg-gradient-to-r from-brand to-accent text-canvas hover:opacity-90"
            : "border border-line text-ink-soft hover:border-accent/50 hover:text-ink",
          className,
        )}
      >
        {wasPaid ? <Send className="size-3.5" aria-hidden /> : null}
        {triggerLabel}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`pf-${booking.id}`}
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/65 p-4 py-8 backdrop-blur-sm sm:items-center"
        >
          <button type="button" aria-label="Tutup" onClick={close} className="fixed inset-0 -z-10 cursor-default" />
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                {paid ? (
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-success">
                    <CheckCircle2 className="size-4" aria-hidden />
                    {justConfirmed ? "Pembayaran terkonfirmasi" : "Sudah lunas"}
                  </p>
                ) : (
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Konfirmasi pembayaran</p>
                )}
                <h2 id={`pf-${booking.id}`} className="mt-1 font-mono text-lg font-extrabold text-ink">
                  {booking.bookingNumber}
                </h2>
              </div>
              <button type="button" onClick={close} aria-label="Tutup" className="-mr-1.5 -mt-1.5 rounded-full p-1.5 text-ink-soft hover:bg-surface-raised hover:text-ink">
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {!paid ? (
              <>
                <dl className="mt-4 space-y-1.5 rounded-2xl border border-line bg-canvas-deep p-4 text-sm">
                  {rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="shrink-0 text-muted">{k}</dt>
                      <dd className="text-right font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
                    <dt className="text-muted">Nominal yang harus masuk</dt>
                    <dd className="text-lg font-extrabold text-ink">{formatRupiah(booking.amount)}</dd>
                  </div>
                </dl>

                {booking.proofDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- base64 data: URL, next/image can't optimize it
                  <img src={booking.proofDataUrl} alt={`Bukti transfer ${booking.bookingNumber}`} className="mt-3 max-h-56 w-full rounded-xl border border-line object-contain" />
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-line px-3 py-4 text-center text-xs text-muted">Belum ada bukti transfer diunggah.</p>
                )}

                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Pastikan dana dengan nominal persis di atas sudah masuk ke rekening. Setelah dikonfirmasi, langkah berikutnya adalah mengirim e-ticket ke pelanggan.
                </p>
                {error ? (
                  <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                    {error}
                  </p>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={close} disabled={pending} className="flex-1 rounded-pill border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink disabled:opacity-50">
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={pending}
                    className="flex-[1.4] rounded-pill bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-bold text-canvas hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? "Memproses…" : "Ya, konfirmasi lunas"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {justConfirmed ? `Langkah terakhir: kirim e-ticket ke ${booking.customerName}.` : `Kirim e-ticket ke ${booking.customerName}.`}
                </p>
                <div className="mt-3">
                  <TicketDelivery booking={{ ...booking, paymentStatus: "PAID" }} templates={templates} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">Bisa dikirim nanti lewat tombol Kirim e-ticket.</p>
                  <button type="button" onClick={close} className="rounded-pill border border-line px-5 py-2 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink">
                    Selesai
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
