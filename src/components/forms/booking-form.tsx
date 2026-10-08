"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AvailabilityResponse, AvailabilitySession } from "@/app/api/availability/route";
import type { ReservationResult } from "@/app/api/reservation/route";
import { formatDate, formatRupiah, formatTimeRange, formatWeekday } from "@/lib/format";
import { Field, FormStatus } from "./field";
import { PICK_PACKAGE_EVENT } from "./pick-package-button";

const MAX_SEATS = 13;

type Errors = Record<string, string>;
type Status = { ok: boolean; message: string } | null;

function groupByDate(sessions: AvailabilitySession[]) {
  const map = new Map<string, AvailabilitySession[]>();
  for (const s of sessions) map.set(s.sessionDate, [...(map.get(s.sessionDate) ?? []), s]);
  return [...map.entries()].map(([date, list]) => ({ date, sessions: list }));
}

/** Kotak pilihan bergaya hololabs-web: kaca gelap, menyala cyan saat dipilih. */
function Choice({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="rounded-xl border px-4 py-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45"
      style={
        active
          ? {
              borderColor: "var(--holo-cyan)",
              background: "color-mix(in srgb, var(--holo-cyan) 9%, transparent)",
              boxShadow: "0 0 24px -10px var(--holo-cyan)",
            }
          : { borderColor: "rgb(255 255 255 / 0.12)", background: "rgb(255 255 255 / 0.02)" }
      }
    >
      {children}
    </button>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <h4 className="holo-eyebrow" style={{ color: "var(--holo-cyan)" }}>
        {title}
      </h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * Form pemesanan show — alur dan teksnya disamakan dengan hololabs-id:
 * pilih tanggal → sesi → paket & jumlah kursi → data pemesan. Sisa kursi dan
 * harga dibaca dari /api/availability; sesi akhir dan total ditentukan server
 * (auto-routing bila sesi yang dipilih ternyata penuh).
 */
export function BookingForm() {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [date, setDate] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [seats, setSeats] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ booking: ReservationResult; whatsapp: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/availability", { cache: "no-store" });
      const next = (await response.json()) as AvailabilityResponse;
      setData(next);
      if (next.connected) {
        setDate((current) => current || next.sessions[0]?.sessionDate || "");
        setPackageId((current) => current || next.packages[0]?.id || "");
      }
    } catch {
      setData({ connected: false });
    }
  }, []);

  useEffect(() => {
    // Satu kali saat mount; data jadwal datang dari jaringan, bukan render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Kartu paket di section Jadwal & Paket memilih paket lewat event ini.
  useEffect(() => {
    const onPick = (event: Event) => setPackageId((event as CustomEvent<string>).detail);
    window.addEventListener(PICK_PACKAGE_EVENT, onPick);
    return () => window.removeEventListener(PICK_PACKAGE_EVENT, onPick);
  }, []);

  const days = useMemo(() => (data?.connected ? groupByDate(data.sessions) : []), [data]);
  const day = days.find((d) => d.date === date);
  const session = day?.sessions.find((s) => s.id === sessionId);
  const pkg = data?.connected ? data.packages.find((p) => p.id === packageId) : undefined;
  const total = (pkg?.price ?? 0) * seats;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      sessionId,
      packageId,
      seats,
      name: String(form.get("name") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      email: String(form.get("email") ?? ""),
    };

    const found: Errors = {};
    if (!payload.sessionId) found.sessionId = "Pilih tanggal dan sesi terlebih dahulu.";
    if (payload.name.trim().length < 3) found.name = "Nama minimal 3 karakter.";
    if (!/^(\+?62|0)8[1-9][0-9]{6,11}$/.test(payload.whatsapp.replace(/[\s-]/g, ""))) {
      found.whatsapp = "Gunakan format nomor Indonesia, contoh 08123456789.";
    }
    if (payload.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
      found.email = "Masukkan alamat email yang valid, atau kosongkan.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ ok: false, message: found.sessionId ?? "Periksa kembali isian yang ditandai." });
      return;
    }

    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? {});
        setStatus({ ok: false, message: body.message });
        void load();
        return;
      }
      setResult({ booking: body.booking, whatsapp: payload.whatsapp });
      void load();
    } catch {
      setStatus({ ok: false, message: "Gagal menghubungi server. Coba lagi sebentar lagi." });
    } finally {
      setPending(false);
    }
  }

  if (result) {
    const { booking } = result;
    return (
      <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-6 sm:p-8" role="status" aria-live="polite">
        <p className="holo-eyebrow" style={{ color: "var(--holo-cyan)" }}>
          Booking {booking.code}
        </p>
        <h4 className="holo-display mt-3 text-2xl">Selesaikan pembayaran</h4>

        {booking.autoRouted ? (
          <p
            className="mt-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--holo-magenta) 45%, transparent)",
              color: "var(--holo-magenta)",
            }}
          >
            Sesi pilihanmu sudah penuh — booking ini otomatis dipindahkan ke sesi terdekat yang masih
            tersedia, tanggal dan jam di bawah ini sudah yang baru.
          </p>
        ) : null}

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-white/45">Sesi</dt>
            <dd className="text-right text-white/90">
              {formatWeekday(booking.sessionDate)}, {formatDate(booking.sessionDate)}
              <br />
              {formatTimeRange(booking.startTime, booking.endTime)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-white/45">Paket</dt>
            <dd className="text-white/90">{booking.packageName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-white/45">Kursi</dt>
            <dd className="text-white/90">{booking.seats}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/60">Total bayar</span>
          <span className="holo-display text-2xl tabular-nums">{formatRupiah(booking.amount)}</span>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-white/60">
          Pembayaran QRIS. Admin HOLOLABS akan mengirim instruksi pembayaran ke WhatsApp{" "}
          <span className="text-white/85">{result.whatsapp}</span>. Simpan kode booking{" "}
          <span className="font-mono text-white/85">{booking.code}</span> untuk check-in di lokasi.
        </p>

        <button
          type="button"
          onClick={() => {
            setResult(null);
            setSessionId("");
            setSeats(1);
          }}
          className="mt-7 rounded-full border border-white/20 px-6 py-3 text-sm text-white/85 transition hover:border-white/50 hover:text-white"
        >
          Pesan tiket lagi
        </button>
      </div>
    );
  }

  if (data === null) {
    return <p className="mt-7 text-sm text-white/45">Memuat jadwal…</p>;
  }

  if (!data.connected) {
    return (
      <FormStatus
        state={{
          ok: false,
          message:
            "Reservasi belum tersambung ke basis data. Sementara ini hubungi kami di hello@hololabs.id.",
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-7 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="space-y-5">
        <Step title="1. Pilih tanggal">
          <div className="flex flex-wrap gap-2.5">
            {days.map((d) => (
              <Choice
                key={d.date}
                active={d.date === date}
                onClick={() => {
                  setDate(d.date);
                  setSessionId("");
                }}
              >
                <span className="block text-[11px] uppercase tracking-[0.14em] text-white/45">
                  {formatWeekday(d.date)}
                </span>
                <span className="block text-sm text-white/90">{formatDate(d.date)}</span>
              </Choice>
            ))}
          </div>
        </Step>

        <Step title="2. Pilih sesi">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {day?.sessions.map((s) => {
              const full = s.seatsLeft <= 0;
              return (
                <Choice key={s.id} active={s.id === sessionId} disabled={full} onClick={() => setSessionId(s.id)}>
                  <span className="block text-sm text-white/90">{formatTimeRange(s.startTime, s.endTime)}</span>
                  <span
                    className="mt-1 block text-xs"
                    style={{ color: full ? "var(--holo-magenta)" : "var(--holo-cyan)" }}
                  >
                    {full ? "Penuh — akan di-auto-route" : `${s.seatsLeft} kursi tersisa`}
                  </span>
                </Choice>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            Kalau sesi yang penuh tetap kamu pilih dan kursinya tidak cukup saat diproses, sistem otomatis
            memindahkan booking ke sesi berikutnya yang masih tersedia.
          </p>
          {errors.sessionId ? (
            <p className="mt-2 text-[11px] text-[var(--holo-magenta)]">{errors.sessionId}</p>
          ) : null}
        </Step>

        <Step title="3. Paket & jumlah kursi">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {data.packages.map((p) => (
              <Choice key={p.id} active={p.id === packageId} onClick={() => setPackageId(p.id)}>
                <span className="flex items-center justify-between gap-2 text-sm text-white/90">
                  {p.name}
                  {p.id === packageId ? <span style={{ color: "var(--holo-cyan)" }}>✓</span> : null}
                </span>
                <span className="mt-1 block text-sm text-white/55 tabular-nums">{formatRupiah(p.price)}</span>
              </Choice>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/12 bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-white/85">Jumlah kursi</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Kurangi kursi"
                onClick={() => setSeats((n) => Math.max(1, n - 1))}
                className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/85 transition hover:border-white/50"
              >
                −
              </button>
              <span className="w-6 text-center text-base tabular-nums text-white" aria-live="polite">
                {seats}
              </span>
              <button
                type="button"
                aria-label="Tambah kursi"
                onClick={() => setSeats((n) => Math.min(MAX_SEATS, n + 1))}
                className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/85 transition hover:border-white/50"
              >
                +
              </button>
            </div>
          </div>
        </Step>

        <Step title="4. Data pemesan">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Nama lengkap"
                name="name"
                required
                placeholder="Nama sesuai identitas"
                error={errors.name}
                autoComplete="name"
              />
            </div>
            <Field
              label="Nomor WhatsApp"
              name="whatsapp"
              type="tel"
              required
              placeholder="08123456789"
              error={errors.whatsapp}
              autoComplete="tel"
            />
            <Field
              label="Email (opsional)"
              name="email"
              type="email"
              placeholder="nama@email.com"
              error={errors.email}
              autoComplete="email"
            />
          </div>
        </Step>

        <FormStatus state={status} />
      </div>

      <aside className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur lg:sticky lg:top-24">
        <h4 className="holo-eyebrow">Ringkasan Booking</h4>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-white/45">Tanggal</dt>
            <dd className="text-right text-white/90">{date ? formatDate(date) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/45">Sesi</dt>
            <dd className="text-right text-white/90">
              {session ? formatTimeRange(session.startTime, session.endTime) : "Belum dipilih"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/45">Paket</dt>
            <dd className="text-right text-white/90">{pkg?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/45">Kursi</dt>
            <dd className="text-right text-white/90">{seats}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/60">Total</span>
          <span className="holo-display text-2xl tabular-nums">{formatRupiah(total)}</span>
        </div>
        <button
          type="submit"
          disabled={pending || !sessionId}
          className="mt-6 w-full rounded-full px-6 py-3.5 text-sm font-medium text-[var(--holo-ink)] transition-transform duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
          style={{ background: "var(--holo-gradient)" }}
        >
          {pending ? "Memproses…" : "Lanjut ke Pembayaran"}
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
          Pembayaran QRIS. Kursi belum terkunci sampai pembayaran diverifikasi admin.
        </p>
      </aside>
    </form>
  );
}
