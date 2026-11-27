"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { AdminBookingRow } from "@/lib/services/admin";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { StatusPill } from "@/components/admin/page-header";
import { cn } from "@/lib/utils/cn";
import { TicketDelivery } from "@/components/admin/ticket-delivery";
import { PaymentFlowDialog } from "@/components/admin/payment-flow-dialog";
import { EditBookingDialog } from "@/components/admin/edit-booking-dialog";
import { DeleteBookingDialog } from "@/components/admin/delete-booking-dialog";
import { SendChangeButton } from "@/components/admin/send-change-button";

type ServerAction = (formData: FormData) => void;

const STAGES: { key: "PENDING" | "SUBMITTED" | "PAID" | "CHECKED_IN"; label: string }[] = [
  { key: "PENDING", label: "Belum transfer" },
  { key: "SUBMITTED", label: "Menunggu konfirmasi" },
  { key: "PAID", label: "Lunas" },
  { key: "CHECKED_IN", label: "Sudah check-in" },
];

function effectiveStage(b: AdminBookingRow): string {
  if (b.status === "CANCELLED") return "CANCELLED";
  if (b.checkinStatus === "CHECKED_IN") return "CHECKED_IN";
  return b.paymentStatus; // PENDING | SUBMITTED | PAID
}

function stageTone(stage: string): "success" | "warning" | "danger" {
  if (stage === "CANCELLED") return "danger";
  if (stage === "PAID" || stage === "CHECKED_IN") return "success";
  return "warning";
}

export function BookingDetailModal({
  booking,
  emailReady,
  checkInBooking,
  cancelBooking,
}: {
  booking: AdminBookingRow;
  emailReady: boolean;
  checkInBooking: ServerAction;
  cancelBooking: ServerAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeModal = () => {
    setOpen(false);
    router.refresh();
  };
  const stage = effectiveStage(booking);
  const canEdit = booking.status !== "CANCELLED" && booking.checkinStatus !== "CHECKED_IN";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-accent/50 hover:text-ink"
      >
        Detail
      </button>

      {open ? createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
          {/* min-h-full + items-center keeps a short modal centred, while a tall one starts at the top and scrolls */}
          <div className="flex min-h-full items-center justify-center p-4 py-8 sm:p-6 sm:py-10">
          <div className="w-full max-w-3xl rounded-card border border-line bg-surface shadow-lift">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-lg font-extrabold text-ink">{booking.bookingNumber}</h2>
                  <StatusPill tone={stageTone(stage)}>
                    {STAGES.find((s) => s.key === stage)?.label ?? (stage === "CANCELLED" ? "Dibatalkan" : stage)}
                  </StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted">Dipesan {booking.createdAt.slice(0, 16).replace("T", " ")}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1.5 text-ink-soft hover:bg-surface-raised hover:text-ink"
                aria-label="Tutup"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div className="space-y-5">
                <section className="rounded-2xl border border-line bg-canvas-deep p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Status reservasi</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STAGES.map((s) => (
                      <span
                        key={s.key}
                        className={cn(
                          "rounded-pill border px-3 py-1.5 text-xs font-semibold",
                          s.key === stage
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-line text-muted",
                        )}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                  {booking.status !== "CANCELLED" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {booking.paymentStatus !== "PAID" ? <PaymentFlowDialog booking={booking} emailReady={emailReady} /> : null}
                      <SendChangeButton booking={booking} emailReady={emailReady} className="items-start" />
                      {booking.paymentStatus === "PAID" && booking.checkinStatus !== "CHECKED_IN" ? (
                        <form action={checkInBooking}>
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <button type="submit" className="rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-accent/50 hover:text-ink">
                            Check-in
                          </button>
                        </form>
                      ) : null}
                      <form action={cancelBooking}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <button type="submit" className="rounded-pill border border-danger/40 px-3.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft">
                          Batalkan
                        </button>
                      </form>
                    </div>
                  ) : null}
                </section>

                <section className="rounded-2xl border border-line bg-canvas-deep p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Informasi tamu</p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Nama</dt>
                      <dd className="font-semibold text-ink">{booking.customerName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">WhatsApp</dt>
                      <dd className="font-semibold text-ink">{booking.whatsapp}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Email</dt>
                      <dd className="truncate font-semibold text-ink">{booking.email || "—"}</dd>
                    </div>
                  </dl>
                </section>

              </div>

              <div className="space-y-5">
                <section className="rounded-2xl border border-line bg-canvas-deep p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Paket & waktu show</p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Paket</dt>
                      <dd className="font-semibold text-ink">{booking.packageName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Jadwal</dt>
                      <dd className="flex items-start justify-end gap-2 text-right font-semibold text-ink">
                        <span>
                          {formatWeekday(booking.sessionDate)}, {formatDate(booking.sessionDate)}
                          <br />
                          {formatTimeRange(booking.startTime, booking.endTime)}
                        </span>
                        {canEdit ? <EditBookingDialog booking={booking} emailReady={emailReady} what="jadwal" className="mt-0.5" /> : null}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Kursi</dt>
                      <dd className="flex items-start justify-end gap-2 text-right font-semibold text-ink">
                        <span>{booking.seatLabels?.length ? `No. ${booking.seatLabels.join(", ")} (${booking.seats})` : booking.seats}</span>
                        {canEdit ? <EditBookingDialog booking={booking} emailReady={emailReady} what="kursi" className="mt-0.5" /> : null}
                      </dd>
                    </div>
                    {booking.uniqueCode ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Kode unik</dt>
                        <dd className="font-semibold text-ink">+ {formatRupiah(booking.uniqueCode)}</dd>
                      </div>
                    ) : null}
                    {booking.note ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Catatan</dt>
                        <dd className="max-w-[16rem] text-right text-ink">{booking.note}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                      <dt className="text-muted">Total</dt>
                      <dd className="font-extrabold text-ink">{formatRupiah(booking.amount)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-line bg-canvas-deep p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Metode pembayaran</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted">Metode</span>
                    <span className="rounded-pill bg-surface-raised px-2.5 py-1 text-xs font-bold text-ink-soft">
                      {booking.paymentMethod === "TRANSFER" ? "Transfer bank" : (booking.paymentMethod ?? "—")}
                    </span>
                  </div>
                  {booking.senderName ? (
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">Nama pengirim</span>
                      <span className="font-semibold text-ink">{booking.senderName}</span>
                    </div>
                  ) : null}
                </section>
              </div>

              <TicketDelivery booking={booking} emailReady={emailReady} className="lg:col-span-2" />

              <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
                <p className="text-xs text-muted">Salah input atau data uji? Hapus datanya dari sistem.</p>
                <DeleteBookingDialog booking={booking} onDeleted={closeModal} />
              </div>
            </div>
          </div>
          </div>
        </div>
      , document.body) : null}
    </>
  );
}
