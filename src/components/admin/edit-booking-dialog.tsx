"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, X } from "lucide-react";
import { loadEditableSessions, loadTakenSeats, saveBookingChange } from "@/app/admin/actions";
import type { AdminBookingRow } from "@/lib/services/admin";
import type { EditableSession } from "@/lib/services/booking-edit";
import { MAX_GUESTS } from "@/lib/services/seat-booking-constants";
import { formatDayMonth, formatWeekdayShort } from "@/lib/utils/date";
import { formatRupiah } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const label = (s: EditableSession) =>
  `${formatWeekdayShort(s.date)}, ${formatDayMonth(s.date)} ${s.date.slice(0, 4)} · ${s.startTime.replace(":", ".")}–${s.endTime.replace(":", ".")} (sisa ${s.left})`;

/**
 * "Ubah": change the show and the seats of an order (a guest asks to move to
 * another time, or to refund a seat). Saving only updates the order. The guest
 * is not emailed from here: the order is flagged, and "Kirim email perubahan"
 * in the Aksi column sends the notice when the admin is ready.
 */
export function EditBookingDialog({ booking, className }: { booking: AdminBookingRow; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<EditableSession[]>([]);
  const [sessionId, setSessionId] = useState(booking.sessionId);
  const [taken, setTaken] = useState<string[]>([]);
  const [seats, setSeats] = useState<string[]>(booking.seatLabels ?? []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ amount: number; previousAmount: number } | null>(null);

  const current = sessions.find((s) => s.id === sessionId);
  const capacity = current?.capacity ?? 18;
  const price = current?.price ?? 0;
  const unique = booking.uniqueCode ?? 0;
  const newAmount = price * seats.length + unique;

  function close() {
    if (saving) return;
    setOpen(false);
    if (saved) router.refresh();
  }

  function openDialog() {
    setSessionId(booking.sessionId);
    setSeats(booking.seatLabels ?? []);
    setError("");
    setSaved(null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    loadEditableSessions(booking.id)
      .then((list) => !cancelled && setSessions(list))
      .catch(() => !cancelled && setError("Daftar jadwal gagal dimuat."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, booking.id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadTakenSeats(booking.id, sessionId)
      .then((list) => !cancelled && setTaken(list))
      .catch(() => !cancelled && setTaken([]));
    return () => {
      cancelled = true;
    };
  }, [open, booking.id, sessionId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        setOpen(false);
        if (saved) router.refresh();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, saved, router]);

  function pickSession(id: string) {
    setSessionId(id);
    setSaved(null);
    setError("");
    // a seat that someone else holds in the new show is dropped once the map loads
    setSeats((prev) => prev.filter((s) => Number(s) <= (sessions.find((x) => x.id === id)?.capacity ?? 18)));
  }

  function toggle(seat: string) {
    setSaved(null);
    setError("");
    setSeats((prev) => {
      if (prev.includes(seat)) return prev.filter((s) => s !== seat);
      if (prev.length >= MAX_GUESTS) {
        setError(`Maksimal ${MAX_GUESTS} kursi per pesanan.`);
        return prev;
      }
      return [...prev, seat].sort((a, b) => Number(a) - Number(b));
    });
  }

  // drop seats that turned out to be held by another order in the chosen show
  useEffect(() => {
    if (taken.length) setSeats((prev) => (prev.some((s) => taken.includes(s)) ? prev.filter((s) => !taken.includes(s)) : prev));
  }, [taken]);

  async function save() {
    setSaving(true);
    setError("");
    const res = await saveBookingChange(booking.id, sessionId, seats);
    setSaving(false);
    if (res.ok) setSaved({ amount: res.amount, previousAmount: res.previousAmount });
    else setError(res.error);
  }

  const unchanged = sessionId === booking.sessionId && [...seats].sort().join(",") === [...(booking.seatLabels ?? [])].sort().join(",");
  const labels = Array.from({ length: capacity }, (_, i) => String(i + 1));

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-accent/50 hover:text-ink",
          className,
        )}
      >
        <Pencil className="size-3.5" aria-hidden />
        Ubah
      </button>

      {open ? (
        <div role="dialog" aria-modal="true" aria-labelledby={`eb-${booking.id}`} className="fixed inset-0 z-[60] overflow-y-auto bg-black/65 backdrop-blur-sm">
          <button type="button" aria-label="Tutup" onClick={close} className="fixed inset-0 -z-10 cursor-default" />
          <div className="flex min-h-full items-center justify-center p-4 py-8 sm:p-6 sm:py-10">
            <div className="w-full max-w-lg rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Ubah pesanan</p>
                  <h2 id={`eb-${booking.id}`} className="mt-1 font-mono text-lg font-extrabold text-ink">
                    {booking.bookingNumber}
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-soft">{booking.customerName}</p>
                </div>
                <button type="button" onClick={close} aria-label="Tutup" className="-mr-1.5 -mt-1.5 rounded-full p-1.5 text-ink-soft hover:bg-surface-raised hover:text-ink">
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <label htmlFor={`eb-s-${booking.id}`} className="mt-5 block text-xs font-bold uppercase tracking-wide text-muted">
                Tanggal dan jam show
              </label>
              <select
                id={`eb-s-${booking.id}`}
                value={sessionId}
                disabled={loading || saving}
                onChange={(e) => pickSession(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-line bg-canvas-deep px-3 text-sm text-ink outline-none focus:border-accent disabled:opacity-60"
              >
                {sessions.length === 0 ? <option value={booking.sessionId}>{loading ? "Memuat jadwal…" : "Jadwal saat ini"}</option> : null}
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {label(s)}
                    {s.current ? " · saat ini" : ""}
                  </option>
                ))}
              </select>

              <div className="mt-5 flex items-baseline justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Pilihan kursi</p>
                <p className="text-xs text-muted">
                  {seats.length} dipilih (maks. {MAX_GUESTS})
                </p>
              </div>
              <div className="mt-2 grid grid-cols-6 gap-2" role="group" aria-label="Pilihan kursi">
                {labels.map((seat) => {
                  const isTaken = taken.includes(seat);
                  const on = seats.includes(seat);
                  return (
                    <button
                      key={seat}
                      type="button"
                      disabled={isTaken || saving}
                      aria-pressed={on}
                      onClick={() => toggle(seat)}
                      title={isTaken ? "Sudah dipesan orang lain" : undefined}
                      className={cn(
                        "h-10 rounded-lg border text-sm font-bold transition-colors",
                        on
                          ? "border-accent bg-accent text-canvas"
                          : isTaken
                            ? "cursor-not-allowed border-line bg-surface-raised text-muted/40 line-through"
                            : "border-line text-ink-soft hover:border-accent/60 hover:text-ink",
                      )}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>

              <dl className="mt-5 space-y-1.5 rounded-2xl border border-line bg-canvas-deep p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Total sekarang</dt>
                  <dd className="font-semibold text-ink">{formatRupiah(booking.amount)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-1.5">
                  <dt className="text-muted">Total setelah diubah</dt>
                  <dd className="font-extrabold text-ink">{formatRupiah(seats.length ? newAmount : 0)}</dd>
                </div>
                {booking.paymentStatus === "PAID" && seats.length > 0 && newAmount < booking.amount ? (
                  <p className="pt-1 text-xs text-warning">Selisih {formatRupiah(booking.amount - newAmount)} dikembalikan ke pelanggan secara manual.</p>
                ) : null}
              </dl>

              {error ? (
                <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                  {error}
                </p>
              ) : null}
              {saved ? (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
                  <CheckCircle2 className="mt-px size-4 shrink-0" aria-hidden />
                  Perubahan tersimpan. Email belum dikirim ke pelanggan: tekan &quot;Kirim email perubahan&quot; di kolom Aksi kalau sudah siap.
                </p>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted">Menyimpan hanya mengubah pesanan. Pelanggan tidak langsung dikirimi email.</p>
              )}

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={close} disabled={saving} className="flex-1 rounded-pill border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink disabled:opacity-50">
                  {saved ? "Selesai" : "Batal"}
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || loading || seats.length === 0 || unchanged || Boolean(saved)}
                  className="flex-[1.4] rounded-pill bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-bold text-canvas hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Menyimpan…" : "Simpan perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
