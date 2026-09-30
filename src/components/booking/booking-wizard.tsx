"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Minus, Plus, Users } from "lucide-react";
import { submitBooking, type BookingFormState } from "@/app/(public)/pesan/actions";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { EmptyState } from "@/components/ui/empty-state";
import type { DaySchedule } from "@/lib/services/availability";
import type { Package } from "@/lib/types";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const initialState: BookingFormState = {};

export function BookingWizard({
  schedule,
  packages,
  initialPackageId,
}: {
  schedule: DaySchedule[];
  packages: Package[];
  initialPackageId?: string;
}) {
  const [state, formAction, pending] = useActionState(submitBooking, initialState);
  const [selectedDate, setSelectedDate] = useState<string>(schedule[0]?.date ?? "");
  const [sessionId, setSessionId] = useState<string>("");
  const [packageId, setPackageId] = useState<string>(
    packages.find((p) => p.id === initialPackageId)?.id ?? packages[0]?.id ?? "",
  );
  const [seats, setSeats] = useState(1);

  const day = schedule.find((d) => d.date === selectedDate);
  const selectedPackage = packages.find((p) => p.id === packageId);
  const total = (selectedPackage?.price ?? 0) * seats;

  const selectedSession = useMemo(
    () => day?.sessions.find((s) => s.id === sessionId),
    [day, sessionId],
  );

  if (schedule.length === 0 || packages.length === 0) {
    return (
      <EmptyState
        title="Sistem pemesanan belum terhubung"
        description="Database belum dikonfigurasi. Jalankan supabase/schema.sql lalu isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local / Vercel."
      />
    );
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="space-y-8">
        {/* Step 1: date */}
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent">1. Pilih tanggal</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {schedule.map((d) => {
              const active = d.date === selectedDate;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.date);
                    setSessionId("");
                  }}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition-colors",
                    active ? "border-brand bg-brand-soft" : "border-line bg-canvas-deep hover:border-brand/40",
                  )}
                >
                  <span className="block text-xs font-bold uppercase tracking-wide text-muted">
                    {formatWeekday(d.date)}
                  </span>
                  <span className="block text-sm font-semibold text-ink">{formatDate(d.date)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: session */}
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent">2. Pilih sesi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {day?.sessions.map((session) => {
              const full = session.seatsLeft <= 0;
              const active = session.id === sessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  disabled={full}
                  onClick={() => setSessionId(session.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    active ? "border-brand bg-brand-soft" : "border-line bg-canvas-deep hover:border-brand/40",
                  )}
                >
                  <span className="block text-sm font-semibold text-ink">
                    {formatTimeRange(session.startTime, session.endTime)}
                  </span>
                  <span className={cn("mt-1 block text-xs font-bold", full ? "text-danger" : "text-success")}>
                    {full ? "Penuh — akan di-auto-route" : `${session.seatsLeft} kursi tersisa`}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Kalau sesi yang penuh tetap kamu pilih dan kursinya tidak cukup saat diproses, sistem
            otomatis memindahkan booking ke sesi berikutnya yang masih tersedia.
          </p>
          <input type="hidden" name="sessionId" value={sessionId} />
        </section>

        {/* Step 3: package + seats */}
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent">3. Paket & jumlah kursi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {packages.map((pkg) => {
              const active = pkg.id === packageId;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setPackageId(pkg.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    active ? "border-brand bg-brand-soft" : "border-line bg-canvas-deep hover:border-brand/40",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink">{pkg.name}</span>
                    {active ? <Check className="size-4 text-accent" aria-hidden /> : null}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-ink-soft">{formatRupiah(pkg.price)}</span>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="packageId" value={packageId} />
          <input type="hidden" name="unitPrice" value={selectedPackage?.price ?? 0} />

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-canvas-deep px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Users className="size-4 text-muted" aria-hidden />
              Jumlah kursi
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSeats((n) => Math.max(1, n - 1))}
                className="flex size-9 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-raised"
                aria-label="Kurangi kursi"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="w-6 text-center text-base font-bold text-ink">{seats}</span>
              <button
                type="button"
                onClick={() => setSeats((n) => Math.min(13, n + 1))}
                className="flex size-9 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-raised"
                aria-label="Tambah kursi"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          <input type="hidden" name="seats" value={seats} />
        </section>

        {/* Step 4: contact */}
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent">4. Data pemesan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap" htmlFor="fullName" required error={state.fieldErrors?.fullName} className="sm:col-span-2">
              <TextInput id="fullName" name="fullName" placeholder="Nama sesuai identitas" error={state.fieldErrors?.fullName} />
            </Field>
            <Field label="Nomor WhatsApp" htmlFor="whatsapp" required error={state.fieldErrors?.whatsapp}>
              <TextInput id="whatsapp" name="whatsapp" placeholder="08123456789" error={state.fieldErrors?.whatsapp} />
            </Field>
            <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
              <TextInput id="email" name="email" type="email" placeholder="nama@email.com" error={state.fieldErrors?.email} />
            </Field>
          </div>
        </section>

        {state.error ? (
          <p role="alert" className="rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : null}
      </div>

      {/* Summary sidebar */}
      <aside className="glass sticky top-24 rounded-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Ringkasan Booking</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Tanggal</dt>
            <dd className="text-right font-semibold text-ink">{selectedDate ? formatDate(selectedDate) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Sesi</dt>
            <dd className="text-right font-semibold text-ink">
              {selectedSession ? formatTimeRange(selectedSession.startTime, selectedSession.endTime) : "Belum dipilih"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Paket</dt>
            <dd className="text-right font-semibold text-ink">{selectedPackage?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Kursi</dt>
            <dd className="text-right font-semibold text-ink">{seats}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-semibold text-ink-soft">Total</span>
          <span className="text-2xl font-extrabold text-ink font-display">{formatRupiah(total)}</span>
        </div>
        <Button type="submit" size="lg" disabled={pending || !sessionId} className="mt-6 w-full">
          {pending ? "Memproses…" : "Lanjut ke Pembayaran"}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          Pembayaran QRIS. Kursi belum terkunci sampai pembayaran diverifikasi admin.
        </p>
      </aside>
    </form>
  );
}
