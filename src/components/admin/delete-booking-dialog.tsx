"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, TriangleAlert } from "lucide-react";
import { deleteBooking } from "@/app/admin/actions";
import type { AdminBookingRow } from "@/lib/services/admin";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";

/**
 * "Hapus data peserta" with a confirmation pop-up. Deleting is permanent, so
 * the pop-up repeats who and what is about to go, and warns louder when the
 * booking is already paid or checked in.
 */
export function DeleteBookingDialog({ booking, onDeleted }: { booking: AdminBookingRow; onDeleted: () => void }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, pending]);

  const cancelled = booking.status === "CANCELLED";
  const paid = booking.paymentStatus === "PAID" && !cancelled;

  async function confirm() {
    setPending(true);
    setError("");
    const res = await deleteBooking(booking.id);
    setPending(false);
    if (res.ok) {
      setOpen(false);
      onDeleted();
    } else {
      setError(res.error ?? "Gagal menghapus data peserta.");
    }
  }

  const rows: [string, string][] = [
    ["Nama", booking.customerName],
    ["Jadwal", `${formatWeekday(booking.sessionDate)}, ${formatDate(booking.sessionDate)} · ${formatTimeRange(booking.startTime, booking.endTime)}`],
    ["Kursi", booking.seatLabels?.length ? `No. ${booking.seatLabels.join(", ")} (${booking.seats})` : `${booking.seats} kursi`],
    ["Total", formatRupiah(booking.amount)],
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-pill border border-danger/40 px-4 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-soft"
      >
        <Trash2 className="size-3.5" aria-hidden />
        Hapus data peserta
      </button>

      {open
        ? createPortal(
            <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[70] overflow-y-auto bg-black/70 backdrop-blur-sm">
              <button type="button" aria-label="Tutup" onClick={() => !pending && setOpen(false)} className="fixed inset-0 -z-10 cursor-default" />
              <div className="flex min-h-full items-center justify-center p-4 py-8 sm:p-6">
                <div className="w-full max-w-md rounded-card border border-danger/40 bg-surface p-5 shadow-lift sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                      <Trash2 className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h2 id={titleId} className="text-base font-extrabold text-ink">
                        Hapus data peserta ini?
                      </h2>
                      <p className="mt-0.5 font-mono text-xs text-muted">{booking.bookingNumber}</p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-1.5 rounded-2xl border border-line bg-canvas-deep p-4 text-sm">
                    {rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="shrink-0 text-muted">{k}</dt>
                        <dd className="text-right font-semibold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Data booking dan data pelanggan ini dihapus permanen dan tidak bisa dikembalikan.
                    {cancelled ? "" : " Kursi yang ia pegang kembali tersedia di sesi tersebut."}
                  </p>
                  {paid ? (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warning-soft px-2.5 py-2 text-xs text-warning">
                      <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                      Booking ini sudah lunas. Catatan pembayarannya ikut hilang dari laporan.
                    </p>
                  ) : null}
                  {error ? (
                    <p role="alert" className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setOpen(false)} disabled={pending} className="flex-1 rounded-pill border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink disabled:opacity-50">
                      Batal
                    </button>
                    <button type="button" onClick={confirm} disabled={pending} className="flex-[1.4] rounded-pill bg-danger px-4 py-2.5 text-sm font-bold text-canvas hover:opacity-90 disabled:opacity-60">
                      {pending ? "Menghapus…" : "Ya, hapus permanen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
