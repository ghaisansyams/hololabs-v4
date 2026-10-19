"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, X } from "lucide-react";
import { submitBooking, type BookingFormState } from "@/app/pesan/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Field, TextInput, Select, Checkbox } from "@/components/forms/field";
import { EmptyState } from "@/components/ui/empty-state";
import { DateCalendar } from "@/components/booking/date-calendar";
import type { DaySchedule } from "@/lib/services/availability";
import type { Package } from "@/lib/types";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const initialState: BookingFormState = {};

/**
 * A two-screen, full-takeover reservation flow — styled after
 * meatguysteakhouse.com's reservation screen: an "Order Summary" sidebar
 * that fills in live, a details screen (package → date → time → guests),
 * then a customer-info screen with terms, submitting straight into the
 * same `submitBooking` server action the rest of the booking engine uses.
 */
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
  const [screen, setScreen] = useState<"details" | "contact">("details");

  const [packageId, setPackageId] = useState<string>(
    packages.find((p) => p.id === initialPackageId)?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [seats, setSeats] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const day = schedule.find((d) => d.date === selectedDate);
  const selectedPackage = packages.find((p) => p.id === packageId);
  const selectedSession = useMemo(() => day?.sessions.find((s) => s.id === sessionId), [day, sessionId]);
  const total = (selectedPackage?.price ?? 0) * seats;
  const maxSeats = selectedSession ? Math.min(13, selectedSession.seatsLeft || 13) : 13;

  if (schedule.length === 0 || packages.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <EmptyState
          title="Sistem pemesanan belum terhubung"
          description="Database belum dikonfigurasi. Jalankan db/schema.sql ke Postgres-mu, lalu isi DATABASE_URL di .env.local (atau environment hosting)."
          action={
            <Link href="/" className="text-sm font-semibold text-accent hover:underline">
              Kembali ke beranda
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="Hololabs — beranda">
          <Logo />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
        >
          Batalkan Reservasi
          <X className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Reservasi</p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[22rem_1fr]">
        {/* Order summary sidebar */}
        <aside className="order-2 lg:order-1">
          <div className="rounded-card border border-line bg-surface p-6">
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>
            <h2 className="text-sm font-bold text-ink">Informasi Reservasi</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <SummaryRow label="Paket" value={selectedPackage?.name} />
              <SummaryRow label="Jumlah kursi" value={sessionId ? String(seats) : undefined} />
              <SummaryRow label="Tanggal" value={selectedDate ? `${formatWeekday(selectedDate)}, ${formatDate(selectedDate)}` : undefined} />
              <SummaryRow
                label="Sesi"
                value={selectedSession ? formatTimeRange(selectedSession.startTime, selectedSession.endTime) : undefined}
              />
            </dl>

            <div className="mt-5 border-t border-line pt-5">
              <h2 className="text-sm font-bold text-ink">Data Pemesan</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <SummaryRow label="Nama" value={fullName || undefined} />
                <SummaryRow label="WhatsApp" value={whatsapp || undefined} />
                <SummaryRow label="Email" value={email || undefined} />
              </dl>
            </div>

            {total > 0 ? (
              <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
                <span className="text-sm font-semibold text-ink-soft">Total</span>
                <span className="text-xl text-ink font-display">{formatRupiah(total)}</span>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Step content */}
        <div className="order-1 lg:order-2">
          {screen === "details" ? (
            <DetailsScreen
              schedule={schedule}
              packages={packages}
              packageId={packageId}
              setPackageId={setPackageId}
              selectedDate={selectedDate}
              setSelectedDate={(d) => {
                setSelectedDate(d);
                setSessionId("");
              }}
              day={day}
              sessionId={sessionId}
              setSessionId={setSessionId}
              seats={seats}
              setSeats={setSeats}
              maxSeats={maxSeats}
              onContinue={() => setScreen("contact")}
            />
          ) : (
            <form action={formAction}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="packageId" value={packageId} />
              <input type="hidden" name="unitPrice" value={selectedPackage?.price ?? 0} />
              <input type="hidden" name="seats" value={seats} />

              <button
                type="button"
                onClick={() => setScreen("details")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Kembali
              </button>

              <h3 className="mt-5 text-2xl text-ink sm:text-3xl">Lengkapi Data Pemesan</h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nama lengkap" htmlFor="fullName" required error={state.fieldErrors?.fullName} className="sm:col-span-2">
                  <TextInput
                    id="fullName"
                    name="fullName"
                    placeholder="Nama sesuai identitas"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={state.fieldErrors?.fullName}
                  />
                </Field>
                <Field label="Nomor WhatsApp" htmlFor="whatsapp" required error={state.fieldErrors?.whatsapp}>
                  <TextInput
                    id="whatsapp"
                    name="whatsapp"
                    placeholder="08123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    error={state.fieldErrors?.whatsapp}
                  />
                </Field>
                <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
                  <TextInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={state.fieldErrors?.email}
                  />
                </Field>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-ink">Ketentuan Reservasi</p>
                <ol className="mt-2 list-decimal space-y-1.5 rounded-2xl border border-line bg-surface p-4 pl-9 text-xs leading-relaxed text-muted">
                  <li>Satu Experience Journey berdurasi 1,5 jam sejak sesi dimulai.</li>
                  <li>Kursi dialokasikan per show dan terbatas — datang 15 menit sebelum jadwal.</li>
                  <li>Jika sesi pilihanmu penuh, sistem otomatis memindahkan ke sesi berikutnya yang tersedia.</li>
                  <li>Kursi belum terkunci sampai pembayaran transfer bank diverifikasi admin.</li>
                  <li>Perubahan atau pembatalan reservasi dapat dibantu lewat WhatsApp admin.</li>
                </ol>
              </div>

              <div className="mt-4">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onChange={setAgreed}
                  label="Saya telah membaca dan menyetujui Ketentuan Reservasi di atas."
                />
              </div>

              {state.error ? (
                <p role="alert" className="mt-4 rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                  {state.error}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={pending || !agreed} className="mt-6 w-full sm:w-auto">
                {pending ? "Memproses…" : "Lanjut ke Pembayaran"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, id }: { label: string; value?: string; id?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd id={id} className="text-right font-semibold text-ink">
        {value ?? "-"}
      </dd>
    </div>
  );
}

function DetailsScreen({
  schedule,
  packages,
  packageId,
  setPackageId,
  selectedDate,
  setSelectedDate,
  day,
  sessionId,
  setSessionId,
  seats,
  setSeats,
  maxSeats,
  onContinue,
}: {
  schedule: DaySchedule[];
  packages: Package[];
  packageId: string;
  setPackageId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  day: DaySchedule | undefined;
  sessionId: string;
  setSessionId: (id: string) => void;
  seats: number;
  setSeats: (updater: (n: number) => number) => void;
  maxSeats: number;
  onContinue: () => void;
}) {
  return (
    <div>
      <h3 className="text-2xl text-ink sm:text-3xl">Lengkapi Informasi Reservasi</h3>

      <div className="mt-6 max-w-xs">
        <Field label="Paket" htmlFor="package-select" required>
          <Select id="package-select" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
            <option value="" disabled>
              Pilih paket
            </option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} — {formatRupiah(pkg.price)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-ink">
          Tanggal <span className="ml-0.5 text-accent">*</span>
        </p>
        <div className="mt-1.5 max-w-xs">
          <DateCalendar availableDates={schedule.map((d) => d.date)} value={selectedDate} onChange={setSelectedDate} />
        </div>
      </div>

      {packageId && day ? (
        <div className="mt-8">
          <p className="text-sm font-bold text-ink">Sesi</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {day.sessions.map((session) => {
              const full = session.seatsLeft <= 0;
              const active = session.id === sessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  disabled={full}
                  onClick={() => setSessionId(session.id)}
                  className={cn(
                    "rounded-pill border px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    active ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-soft hover:border-accent/50",
                  )}
                >
                  {formatTimeRange(session.startTime, session.endTime)}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Kalau sesi yang penuh tetap kamu pilih dan kursinya tidak cukup saat diproses, sistem otomatis
            memindahkan reservasi ke sesi berikutnya yang masih tersedia.
          </p>
        </div>
      ) : null}

      {sessionId ? (
        <div className="mt-8">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4">
            <div>
              <p className="text-sm font-bold text-ink">Jumlah kursi</p>
              <p className="text-xs text-accent">
                Sisa kapasitas: <span className="font-semibold">{maxSeats}</span>
              </p>
            </div>
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
                onClick={() => setSeats((n) => Math.min(maxSeats, n + 1))}
                className="flex size-9 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-raised"
                aria-label="Tambah kursi"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <Button type="button" size="lg" onClick={onContinue} className="mt-6 w-full sm:w-auto">
            Lanjutkan Reservasi
          </Button>
        </div>
      ) : null}
    </div>
  );
}
