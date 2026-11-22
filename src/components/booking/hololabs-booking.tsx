"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SeatMap } from "@/components/booking/seat-map";

/**
 * The four-step booking flow of hololabs.id/booking: Jadwal (date, show and
 * seats on the map), Data diri, Ketentuan, Pembayaran, with a running
 * summary beside it. Availability refreshes every 30 s and the open seat map
 * every 15 s; seats someone else just took drop out of the selection with a
 * message. Placing the order calls POST /api/booking, which answers with the
 * payment page URL.
 */

export interface BookingSessionView {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  capacity: number;
  left: number;
  price: number;
  bookable: boolean;
}

export interface BookingDayView {
  date: string;
  sessions: BookingSessionView[];
}

type Contact = { name: string; email: string; whatsapp: string; note: string };
type Errors = Partial<Record<keyof Contact | "sessionId" | "seats" | "agree", string>>;

const STEPS = ["Jadwal", "Data diri", "Ketentuan", "Pembayaran"];

const fmtDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const rupiah = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(n);
const endTime = (start: string, minutes: number) => {
  const [h, m] = start.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}.${String(t % 60).padStart(2, "0")}`;
};
const sortSeats = (list: string[]) => [...list].sort((a, b) => Number(a) - Number(b));
const seatList = (list: string[]) => sortSeats(list).join(", ");

const inputBase =
  "min-h-12 w-full rounded-xl border bg-hl-ink px-4 text-base text-hl-fg placeholder:text-[#7d7790] outline-none transition focus:border-hl-violet focus:ring-2 focus:ring-hl-violet/40";

function validateContact(c: Contact): Errors {
  const e: Errors = {};
  if (c.name.trim().length < 2) e.name = "Nama minimal 2 huruf";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) e.email = "Format email belum benar";
  const wa = c.whatsapp.replace(/[^\d]/g, "").replace(/^0/, "62").replace(/^8/, "628");
  if (!/^628\d{7,12}$/.test(wa)) e.whatsapp = "Nomor WhatsApp belum benar (contoh: 0812 3456 7890)";
  if (c.note.length > 300) e.note = "Catatan maksimal 300 karakter";
  return e;
}

export function HololabsBooking({
  initialDays,
  maxGuests,
  terms,
  paymentMinutes,
  bank,
  whatsapp,
}: {
  initialDays: BookingDayView[];
  maxGuests: number;
  terms: string[];
  paymentMinutes: number;
  bank: { bank: string; holder: string };
  /** E.164 without "+", e.g. 62816712339 */
  whatsapp: string;
}) {
  const whatsappLink = (text: string) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
  const router = useRouter();
  const [days, setDays] = useState(initialDays);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(
    () => initialDays.find((d) => d.sessions.some((s) => s.bookable))?.date ?? initialDays[0]?.date ?? "",
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [contact, setContact] = useState<Contact>({ name: "", email: "", whatsapp: "", note: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // live availability
  useEffect(() => {
    let alive = true;
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/booking/availability", { cache: "no-store" });
        const json = await res.json();
        if (alive && json.ok) setDays(json.days);
      } catch {}
    }, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const loadSeats = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/booking/seats?session=${id}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setTaken(json.taken);
        setSeats((current) => {
          const lost = current.filter((s) => json.taken.includes(s));
          if (lost.length) setMessage(`Kursi ${seatList(lost)} baru saja dipesan orang lain. Silakan pilih kursi lain.`);
          return current.filter((s) => !json.taken.includes(s));
        });
      }
    } catch {
    } finally {
      setLoadingSeats(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId || step !== 0) return;
    const timer = setInterval(() => loadSeats(sessionId), 15_000);
    return () => clearInterval(timer);
  }, [sessionId, step, loadSeats]);

  const day = days.find((d) => d.date === date);
  const session = useMemo(() => {
    for (const d of days) for (const s of d.sessions) if (s.id === sessionId) return s;
  }, [days, sessionId]);
  const limit = session ? Math.min(maxGuests, session.left) : maxGuests;
  const count = seats.length;
  const total = session ? session.price * count : 0;
  const scheduleReady = !!session && session.bookable && count > 0 && session.left >= count;
  const seatLabels = session ? Array.from({ length: session.capacity }, (_, i) => String(i + 1)) : [];

  function toggleSeat(label: string) {
    setMessage("");
    setSeats((current) => {
      if (current.includes(label)) return current.filter((s) => s !== label);
      if (current.length >= limit) {
        setMessage(
          limit < maxGuests
            ? `Sisa kursi untuk jadwal ini tinggal ${limit}.`
            : `Maksimal ${maxGuests} kursi per pesanan. Untuk rombongan, hubungi kami lewat WhatsApp.`,
        );
        return current;
      }
      return sortSeats([...current, label]);
    });
  }

  function next() {
    setMessage("");
    if (step === 0 && !scheduleReady) {
      setMessage(session ? "Pilih kursi dulu di denah." : "Pilih jadwal show yang masih tersedia.");
      return;
    }
    if (step === 1) {
      const e = validateContact(contact);
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 2 && !agree) {
      setMessage("Centang persetujuan syarat & ketentuan dulu.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function placeOrder() {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, seats, ...contact, agree }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        router.push(json.url);
        return;
      }
      const fieldErrors: Errors = json.fieldErrors ?? {};
      setErrors(fieldErrors);
      setMessage(json.error ?? "Terjadi kesalahan. Coba lagi.");
      if (fieldErrors.sessionId || fieldErrors.seats) {
        const fresh = await fetch("/api/booking/availability", { cache: "no-store" }).then((r) => r.json());
        if (fresh.ok) setDays(fresh.days);
        if (Array.isArray(json.taken)) {
          setTaken(json.taken);
          setSeats((current) => current.filter((s) => !json.taken.includes(s)));
        }
        setStep(0);
      } else if (fieldErrors.name || fieldErrors.email || fieldErrors.whatsapp || fieldErrors.note) {
        setStep(1);
      }
    } catch {
      setMessage("Koneksi terputus. Periksa internet kamu lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="flex flex-col gap-5">
        <ol className="grid grid-cols-4 gap-2" aria-label="Langkah booking">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  aria-current={current ? "step" : undefined}
                  className="flex w-full flex-col items-start gap-2 text-left disabled:cursor-default"
                >
                  <span className={`h-1 w-full rounded-full transition ${current || done ? "hl-grad" : "bg-white/10"}`} />
                  <span className={`text-[12px] sm:text-[13px] ${current ? "text-hl-fg" : done ? "text-[#c9c4d9]" : "text-[#7d7790]"}`}>
                    <span className="max-sm:hidden">{i + 1}. </span>
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <section key={step} className="hl-rise rounded-3xl border border-white/10 bg-hl-panel/85 p-5 backdrop-blur sm:p-7">
          {step === 0 ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="hl-display text-2xl font-semibold">Pilih tanggal</h2>
                <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
                  {days.map((d) => {
                    const open = d.sessions.filter((s) => s.bookable);
                    const left = open.reduce((sum, s) => sum + s.left, 0);
                    const active = d.date === date;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          setDate(d.date);
                          setSessionId(null);
                          setSeats([]);
                          setTaken([]);
                        }}
                        className={`flex min-w-[76px] snap-start flex-col items-center gap-0.5 rounded-2xl border px-3 py-3 transition ${
                          active ? "border-hl-violet bg-hl-violet/20" : open.length ? "border-white/15 hover:border-white/35" : "border-white/5 opacity-45"
                        }`}
                      >
                        <span className="text-[12px] uppercase tracking-wide text-[#a9a3bc]">{fmtDate(d.date, { weekday: "short" })}</span>
                        <span className="hl-display text-2xl font-semibold">{fmtDate(d.date, { day: "numeric" })}</span>
                        <span className="text-[12px] text-[#a9a3bc]">{fmtDate(d.date, { month: "short" })}</span>
                        <span
                          className={`mt-1 size-1.5 rounded-full ${!open.length ? "bg-white/20" : left <= 3 ? "bg-amber-300" : "bg-emerald-300"}`}
                          aria-label={open.length ? (left <= 3 ? "hampir penuh" : "tersedia") : "tidak tersedia"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="hl-display text-2xl font-semibold">Pilih jam show</h2>
                <p className="mt-1 text-[15px] text-[#a9a3bc]">
                  {date && fmtDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {day?.sessions.length ? (
                    day.sessions.map((s) => {
                      const active = s.id === sessionId;
                      const filled = Math.round(((s.capacity - s.left) / s.capacity) * 100);
                      const status = s.bookable ? (s.left <= 3 ? `Sisa ${s.left} kursi` : `${s.left} kursi tersedia`) : s.left === 0 ? "Penuh" : "Ditutup";
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!s.bookable}
                          onClick={() => {
                            setSessionId(s.id);
                            setSeats([]);
                            setTaken([]);
                            setLoadingSeats(true);
                            loadSeats(s.id);
                          }}
                          className={`flex flex-col gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                            active ? "border-hl-violet bg-hl-violet/15 shadow-[0_0_30px_rgba(139,92,246,.25)]" : "border-white/15 hover:border-white/35"
                          }`}
                        >
                          <span className="flex w-full items-baseline justify-between gap-3">
                            <span className="hl-display text-2xl font-semibold">
                              {s.startTime.replace(":", ".")}
                              <span className="text-base font-normal text-[#a9a3bc]"> – {endTime(s.startTime, s.durationMinutes)} WIB</span>
                            </span>
                            <span className="text-[15px] text-[#d3cee2]">{rupiah(s.price)}</span>
                          </span>
                          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <span className="hl-grad block h-full rounded-full" style={{ width: `${filled}%` }} />
                          </span>
                          <span className={`text-[13px] ${s.bookable && s.left <= 3 ? "text-amber-200" : "text-[#a9a3bc]"}`}>{status}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-[15px] text-[#a9a3bc]">Tidak ada show di tanggal ini. Pilih tanggal lain.</p>
                  )}
                </div>
              </div>

              {session ? (
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="hl-display text-2xl font-semibold">Pilih kursi</h2>
                    <span className="text-[14px] text-[#a9a3bc]">
                      {count ? `${count} kursi: ${seatList(seats)}` : `Ketuk kursi bar yang kamu mau (maks. ${limit})`}
                    </span>
                  </div>
                  <div className={`mt-4 rounded-2xl border border-white/10 bg-hl-ink/50 p-4 sm:p-5 ${loadingSeats ? "opacity-50" : ""}`}>
                    <SeatMap seats={seatLabels} taken={taken} selected={seats} onToggle={toggleSeat} disabled={loadingSeats} />
                  </div>
                  <p className="mt-3 text-[14px] text-[#a9a3bc]">
                    1 kursi = 1 tiket. Maks. {maxGuests} kursi per pesanan.{" "}
                    <a
                      href={whatsappLink("Halo HOLOLABS, saya ingin booking untuk rombongan.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-200 underline underline-offset-4"
                    >
                      Rombongan lebih besar?
                    </a>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <h2 className="hl-display text-2xl font-semibold">Data pemesan</h2>
              <p className="-mt-2 text-[15px] text-[#a9a3bc]">E-ticket dikirim ke email dan nomor ini.</p>
              {(
                [
                  { k: "name", label: "Nama lengkap", type: "text", ac: "name", ph: "Nama sesuai identitas", im: "text" },
                  { k: "whatsapp", label: "Nomor WhatsApp", type: "tel", ac: "tel", ph: "08xx xxxx xxxx", im: "tel" },
                  { k: "email", label: "Email", type: "email", ac: "email", ph: "nama@email.com", im: "email" },
                ] as const
              ).map((f) => (
                <label key={f.k} className="flex flex-col gap-1.5 text-[13px] text-[#c9c4d9]">
                  {f.label}
                  <input
                    type={f.type}
                    inputMode={f.im}
                    autoComplete={f.ac}
                    placeholder={f.ph}
                    value={contact[f.k]}
                    onChange={(e) => setContact({ ...contact, [f.k]: e.target.value })}
                    aria-invalid={!!errors[f.k]}
                    className={`${inputBase} ${errors[f.k] ? "border-rose-400" : "border-white/15"}`}
                  />
                  {errors[f.k] ? <span className="text-rose-300">{errors[f.k]}</span> : null}
                </label>
              ))}
              <label className="flex flex-col gap-1.5 text-[13px] text-[#c9c4d9]">
                Catatan (opsional)
                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="Mis. merayakan ulang tahun, butuh kursi roda, dll."
                  value={contact.note}
                  onChange={(e) => setContact({ ...contact, note: e.target.value })}
                  className={`${inputBase} min-h-24 border-white/15 py-3`}
                />
                {errors.note ? <span className="text-rose-300">{errors.note}</span> : null}
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-4">
              <h2 className="hl-display text-2xl font-semibold">Syarat &amp; ketentuan</h2>
              <ol className="flex max-h-[46vh] list-decimal flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-hl-ink/60 py-4 pl-9 pr-4 text-[15px] leading-relaxed text-[#d3cee2]">
                {terms.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
              <label className="flex cursor-pointer items-start gap-3 text-[15px] text-hl-fg">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 size-5 shrink-0 accent-hl-violet"
                />
                Saya sudah membaca dan menyetujui syarat &amp; ketentuan di atas.
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-4">
              <h2 className="hl-display text-2xl font-semibold">Pembayaran</h2>
              <div
                role="radiogroup"
                aria-label="Metode pembayaran"
                className="flex flex-col gap-1 rounded-2xl border border-hl-violet bg-hl-violet/15 p-5 shadow-[0_0_30px_rgba(139,92,246,.25)]"
              >
                <span role="radio" aria-checked="true" className="hl-display text-lg font-semibold">
                  Transfer bank {bank.bank}
                </span>
                <span className="text-[14px] text-[#d3cee2]">
                  Ke rekening {bank.bank} a.n. {bank.holder}. Bisa dari bank mana pun, m-banking, atau e-wallet.
                </span>
              </div>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed text-[#d3cee2]">
                <li>Setelah klik tombol di bawah, nomor rekening dan nominal transfer muncul. Kursi ditahan {paymentMinutes} menit.</li>
                <li>
                  Nominal sudah dipotong <b>kode unik</b> (Rp1–999) supaya transfermu langsung kami kenali. Transfer persis sesuai angka itu.
                </li>
                <li>Tekan &quot;Saya sudah transfer&quot; dan (opsional) unggah bukti. E-ticket dikirim setelah tim kami memverifikasi.</li>
              </ol>
            </div>
          ) : null}

          {message ? (
            <p role="alert" className="mt-5 rounded-xl bg-rose-500/10 px-4 py-3 text-[15px] text-rose-200">
              {message}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setStep(step - 1);
                }}
                className="min-h-12 cursor-pointer rounded-full border border-white/15 px-6 text-[15px] text-[#d3cee2] transition hover:border-white/40"
              >
                ← Kembali
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="hl-grad min-h-12 cursor-pointer rounded-full px-8 text-base font-semibold text-white transition hover:shadow-[0_0_36px_rgba(139,92,246,.55)]"
              >
                Lanjut
              </button>
            ) : (
              <button
                type="button"
                onClick={placeOrder}
                disabled={submitting}
                className="hl-grad min-h-12 cursor-pointer rounded-full px-8 text-base font-semibold text-white transition hover:shadow-[0_0_36px_rgba(139,92,246,.55)] disabled:opacity-60"
              >
                {submitting ? "Memproses…" : "Pesan & lihat rekening"}
              </button>
            )}
          </div>
        </section>
      </div>

      <aside className="rounded-3xl border border-white/10 bg-hl-panel/85 p-6 backdrop-blur lg:sticky lg:top-6">
        <p className="hl-eyebrow">RINGKASAN</p>
        <dl className="mt-4 flex flex-col gap-3 text-[15px]">
          {(
            [
              ["Show", "HOLOLABS Experience Journey"],
              ["Tanggal", session ? fmtDate(session.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "–"],
              ["Jam", session ? `${session.startTime.replace(":", ".")} WIB` : "–"],
              ["Kursi", count ? seatList(seats) : "–"],
              ["Tiket", session ? `${count} × ${rupiah(session.price)}` : "–"],
              ...(step >= 3 ? [["Bayar via", `Transfer ${bank.bank}`]] : []),
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-[#a9a3bc]">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
          <span className="text-[#a9a3bc]">Total</span>
          <span className="hl-display text-3xl font-bold">{rupiah(total)}</span>
        </div>
        {total > 0 ? <p className="mt-2 text-right text-[13px] text-[#a9a3bc]">Nanti dipotong kode unik Rp1–999</p> : null}
      </aside>
    </div>
  );
}
