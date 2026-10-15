"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import type { AdminBookingRow } from "@/lib/services/admin";
import { waTemplates } from "@/data/wa-templates";
import { toWhatsappE164 } from "@/lib/utils/phone";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { StatusPill } from "@/components/admin/page-header";
import { cn } from "@/lib/utils/cn";

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
  markBookingPaid,
  checkInBooking,
  cancelBooking,
}: {
  booking: AdminBookingRow;
  markBookingPaid: ServerAction;
  checkInBooking: ServerAction;
  cancelBooking: ServerAction;
}) {
  const [open, setOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState(waTemplates[0].key);
  const [draft, setDraft] = useState(() => waTemplates[0].build(booking));
  const [copied, setCopied] = useState(false);

  const stage = effectiveStage(booking);
  const waLink = `https://wa.me/${toWhatsappE164(booking.whatsapp)}?text=${encodeURIComponent(draft)}`;

  function selectTemplate(key: string) {
    setTemplateKey(key);
    const tpl = waTemplates.find((t) => t.key === key);
    if (tpl) setDraft(tpl.build(booking));
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard unavailable
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-accent/50 hover:text-ink"
      >
        Detail
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-8 backdrop-blur-sm sm:items-center">
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
                onClick={() => setOpen(false)}
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
                      {booking.paymentStatus !== "PAID" ? (
                        <form action={markBookingPaid}>
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <button
                            type="submit"
                            className="rounded-pill bg-gradient-to-r from-brand to-accent px-3.5 py-1.5 text-xs font-bold text-canvas"
                          >
                            {booking.paymentStatus === "SUBMITTED" ? "Konfirmasi pembayaran" : "Tandai lunas"}
                          </button>
                        </form>
                      ) : null}
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

                <section className="rounded-2xl border border-line bg-canvas-deep p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Paket & waktu show</p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Paket</dt>
                      <dd className="font-semibold text-ink">{booking.packageName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Jadwal</dt>
                      <dd className="text-right font-semibold text-ink">
                        {formatWeekday(booking.sessionDate)}, {formatDate(booking.sessionDate)}
                        <br />
                        {formatTimeRange(booking.startTime, booking.endTime)} WIB
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Kursi</dt>
                      <dd className="font-semibold text-ink">{booking.seats}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                      <dt className="text-muted">Total</dt>
                      <dd className="font-extrabold text-ink">{formatRupiah(booking.amount)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-line bg-canvas-deep p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Metode & bukti pembayaran</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted">Metode</span>
                    <span className="rounded-pill bg-surface-raised px-2.5 py-1 text-xs font-bold text-ink-soft">
                      {booking.paymentMethod === "TRANSFER" ? "Transfer bank" : (booking.paymentMethod ?? "—")}
                    </span>
                  </div>
                  <div className="mt-3">
                    {booking.proofDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- base64 data: URL, next/image can't optimize it
                      <img
                        src={booking.proofDataUrl}
                        alt={`Bukti transfer ${booking.bookingNumber}`}
                        className="max-h-64 w-full rounded-xl border border-line object-contain"
                      />
                    ) : (
                      <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                        Belum ada bukti pembayaran diunggah.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-3 rounded-2xl border border-line bg-canvas-deep p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                  <MessageCircle className="size-3.5 text-success" aria-hidden />
                  Generator pesan WhatsApp
                </div>
                <p className="text-xs text-muted">Pilih template dan kirim langsung ke {booking.whatsapp}.</p>

                <div className="grid grid-cols-2 gap-2">
                  {waTemplates.map((tpl) => (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => selectTemplate(tpl.key)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                        tpl.key === templateKey
                          ? "border-success/50 bg-success-soft text-success"
                          : "border-line text-ink-soft hover:border-accent/40",
                      )}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink-soft">Draft pesan (bisa diedit)</p>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={11}
                    className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-xs leading-relaxed text-ink outline-none focus:border-accent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyDraft}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-line px-3 py-2 text-xs font-semibold text-ink-soft hover:border-accent/50 hover:text-ink"
                  >
                    {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    {copied ? "Tersalin" : "Salin pesan"}
                  </button>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-success px-3 py-2 text-xs font-bold text-canvas"
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    Buka di WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
