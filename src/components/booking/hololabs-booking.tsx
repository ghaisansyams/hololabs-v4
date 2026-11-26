"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SeatMap } from "@/components/booking/seat-map";

/**
 * The five-step booking flow: Jadwal (month calendar beside the show times),
 * Pilih kursi (seat map), Data diri, Ketentuan, Pembayaran, with a running
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

export type BookingCopy = {
  stepLabels: string[];
  dateTitle: string;
  timeTitle: string;
  seatTitle: string;
  dataTitle: string;
  dataNote: string;
  emailHint: string;
  termsTitle: string;
  paymentTitle: string;
};

const fmtDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const rupiah = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(n);
const endTime = (start: string, minutes: number) => {
  const [h, m] = start.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}.${String(t % 60).padStart(2, "0")}`;
};
const LAST_STEP = 4;
const sortSeats = (list: string[]) => [...list].sort((a, b) => Number(a) - Number(b));
const seatList = (list: string[]) => sortSeats(list).join(", ");

const GMAIL = "@gmail.com";

/** The guest only types the part before @gmail.com; a typed "@" or a pasted full Gmail address is folded back to that part. */
function gmailLocal(raw: string): string {
  const v = raw.replace(/\s/g, "");
  const at = v.indexOf("@");
  if (at < 0) return v;
  const domain = v.slice(at + 1).toLowerCase();
  return domain === "" || "gmail.com".startsWith(domain) ? v.slice(0, at) : v;
}

const inputBase =
  "min-h-12 w-full rounded-xl border bg-hl-ink px-4 text-base text-hl-fg placeholder:text-[#7d7790] outline-none transition focus:border-hl-violet focus:ring-2 focus:ring-hl-violet/40";

function validateContact(c: Contact): Errors {
  const e: Errors = {};
  if (c.name.trim().length < 2) e.name = "Nama minimal 2 huruf";
  const mail = c.email.trim();
  if (mail.includes("@")) e.email = "Hanya Gmail yang diterima. Ketik bagian sebelum @gmail.com saja";
  else if (!/^[A-Za-z0-9._+-]{3,64}$/.test(mail)) e.email = "Nama Gmail belum benar";
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
  copy,
}: {
  copy: BookingCopy;
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
  /** Taken seats of every show on the chosen date, for the time switcher on the seat step. */
  const [dayTaken, setDayTaken] = useState<Record<string, string[]>>({});
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
    if (!sessionId || step !== 1) return;
    const timer = setInterval(() => loadSeats(sessionId), 15_000);
    return () => clearInterval(timer);
  }, [sessionId, step, loadSeats]);

  const day = days.find((d) => d.date === date);
  const daySessionIds = (day?.sessions ?? []).filter((x) => x.bookable).map((x) => x.id).join(",");

  useEffect(() => {
    if (step !== 1 || !daySessionIds) return;
    let alive = true;
    const load = () =>
      Promise.all(
        daySessionIds.split(",").map(async (id) => {
          try {
            const json = await fetch(`/api/booking/seats?session=${id}`, { cache: "no-store" }).then((r) => r.json());
            return [id, json.ok ? (json.taken as string[]) : null] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      ).then((list) => {
        if (!alive) return;
        setDayTaken((cur) => {
          const next = { ...cur };
          for (const [id, t] of list) if (t) next[id] = t;
          return next;
        });
      });
    load();
    const timer = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [step, daySessionIds]);
  const session = useMemo(() => {
    for (const d of days) for (const s of d.sessions) if (s.id === sessionId) return s;
  }, [days, sessionId]);
  const limit = session ? Math.min(maxGuests, session.left) : maxGuests;
  const count = seats.length;
  const total = session ? session.price * count : 0;
  const sessionReady = !!session && session.bookable;
  const seatsReady = sessionReady && count > 0 && session.left >= count;
  const seatLabels = session ? Array.from({ length: session.capacity }, (_, i) => String(i + 1)) : [];

  /** Moves the order to another show on the same date, keeping the chosen seats that are free there. */
  function switchSession(id: string) {
    if (id === sessionId) return;
    const target = day?.sessions.find((x) => x.id === id);
    if (!target) return;
    const known = dayTaken[id];
    const keep = known ? seats.filter((x) => !known.includes(x)).slice(0, Math.min(maxGuests, target.left)) : [];
    const dropped = seats.filter((x) => !keep.includes(x));
    setMessage(
      dropped.length && known
        ? `Kursi ${seatList(dropped)} sudah terisi di jam ${target.startTime.replace(":", ".")}. Pilih kursi lain di denah.`
        : "",
    );
    setSessionId(id);
    setSeats(known ? keep : []);
    setTaken(known ?? []);
    setLoadingSeats(!known);
    loadSeats(id);
  }

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
    if (step === 0 && !sessionReady) {
      setMessage("Pilih tanggal dan jam pertunjukan yang masih tersedia.");
      return;
    }
    if (step === 1 && !seatsReady) {
      setMessage("Pilih kursi dulu di denah.");
      return;
    }
    if (step === 2) {
      const e = validateContact(contact);
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 3 && !agree) {
      setMessage("Centang persetujuan syarat & ketentuan dulu.");
      return;
    }
    setStep((s) => Math.min(LAST_STEP, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function placeOrder() {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, seats, ...contact, email: contact.email.trim() + GMAIL, agree }),
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
        setStep(fieldErrors.sessionId ? 0 : 1);
      } else if (fieldErrors.name || fieldErrors.email || fieldErrors.whatsapp || fieldErrors.note) {
        setStep(2);
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
        <ol className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label="Langkah pemesanan">
          {copy.stepLabels.map((label, i) => {
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
                  <span className={`text-[11px] leading-tight sm:text-[13px] ${current ? "text-hl-fg" : done ? "text-[#c9c4d9]" : "text-[#7d7790]"}`}>
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
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-7">
              <div>
                <h2 className="hl-display text-2xl font-semibold">{copy.dateTitle}</h2>
                <BookingCalendar
                  days={days}
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setSessionId(null);
                    setSeats([]);
                    setTaken([]);
                  }}
                />
              </div>

              <div className="md:border-l md:border-white/10 md:pl-7">
                <h2 className="hl-display text-2xl font-semibold">{copy.timeTitle}</h2>
                <p className="mt-1 text-[15px] text-[#a9a3bc]">
                  {date ? fmtDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Pilih tanggal dulu"}
                </p>
                <div role="radiogroup" aria-label={copy.timeTitle} className="mt-4 flex flex-col gap-3">
                  {day?.sessions.length ? (
                    day.sessions.map((s) => {
                      const active = s.id === sessionId;
                      const filled = Math.round(((s.capacity - s.left) / s.capacity) * 100);
                      const low = s.bookable && s.left <= 3;
                      const status = s.bookable ? (low ? `Sisa ${s.left} kursi` : `${s.left} kursi tersedia`) : s.left === 0 ? "Penuh" : "Ditutup";
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={!s.bookable}
                          onClick={() => {
                            setMessage("");
                            setSessionId(s.id);
                            setSeats([]);
                            setTaken([]);
                            setLoadingSeats(true);
                            loadSeats(s.id);
                          }}
                          className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                            active ? "border-hl-violet bg-hl-violet/15 shadow-[0_0_30px_rgba(139,92,246,.25)]" : "border-white/15 hover:border-white/35"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                              active ? "border-hl-violet" : "border-white/30 group-hover:border-white/50"
                            }`}
                          >
                            {active ? <span className="hl-grad size-2.5 rounded-full" /> : null}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-2">
                            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <span className="hl-display text-xl font-semibold">
                                {s.startTime.replace(":", ".")}
                                <span className="text-[15px] font-normal text-[#a9a3bc]"> – {endTime(s.startTime, s.durationMinutes)} WIB</span>
                              </span>
                              <span className="text-[14px] text-[#d3cee2]">{rupiah(s.price)}</span>
                            </span>
                            <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <span className="hl-grad block h-full rounded-full" style={{ width: `${filled}%` }} />
                            </span>
                            <span className="flex items-center justify-between gap-2 text-[13px]">
                              <span className={low ? "text-amber-200" : s.bookable ? "text-emerald-200" : "text-[#a9a3bc]"}>{status}</span>
                              <span className="text-[#7d7790]">{s.durationMinutes} menit</span>
                            </span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-[15px] text-[#a9a3bc]">
                      Tidak ada pertunjukan di tanggal ini. Pilih tanggal lain di kalender.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 && session ? (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="hl-display text-2xl font-semibold">{copy.seatTitle}</h2>
                <span className="text-[14px] text-[#a9a3bc]">
                  {count ? `${count} kursi: ${seatList(seats)}` : `Ketuk kursi yang kamu mau (maks. ${limit})`}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-hl-ink/40 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] text-[#d3cee2]">
                    Jam pertunjukan · <span className="text-hl-fg">{fmtDate(session.date, { weekday: "long", day: "numeric", month: "long" })}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setStep(0);
                    }}
                    className="min-h-9 cursor-pointer px-1 text-[13px] text-cyan-200 underline underline-offset-4"
                  >
                    Ganti tanggal
                  </button>
                </div>
                <div role="radiogroup" aria-label="Pilih jam pertunjukan" className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(day?.sessions ?? [session]).map((x) => {
                    const active = x.id === sessionId;
                    const t = active ? taken : (dayTaken[x.id] ?? null);
                    const need = Math.max(2, count);
                    const run = t ? longestFreeRun(x.capacity, t) : null;
                    return (
                      <button
                        key={x.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!x.bookable}
                        onClick={() => switchSession(x.id)}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                          active ? "border-hl-violet bg-hl-violet/15" : "cursor-pointer border-white/15 hover:border-white/35"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-hl-violet" : "border-white/30"}`}
                        >
                          {active ? <span className="hl-grad size-2 rounded-full" /> : null}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="hl-display text-lg font-semibold leading-tight">
                            {x.startTime.replace(":", ".")}
                            <span className="text-[13px] font-normal text-[#a9a3bc]"> – {endTime(x.startTime, x.durationMinutes)} WIB</span>
                          </span>
                          <span className="text-[12.5px] text-[#a9a3bc]">
                            {x.bookable ? `${x.left} kursi kosong` : x.left === 0 ? "Penuh" : "Ditutup"}
                            {x.bookable && run !== null ? (
                              <span className={run >= need ? "text-emerald-200" : "text-amber-200"}>
                                {" · "}
                                {run >= need ? `bisa ${need} kursi berdampingan` : run <= 1 ? "tidak ada kursi berdampingan" : `maks. ${run} berdampingan`}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={`mt-4 rounded-2xl border border-white/10 bg-hl-ink/50 p-4 sm:p-5 ${loadingSeats ? "opacity-50" : ""}`}>
                <SeatMap seats={seatLabels} taken={taken} selected={seats} onToggle={toggleSeat} disabled={loadingSeats} />
              </div>
              <p className="mt-3 text-[14px] text-[#a9a3bc]">
                1 kursi = 1 tiket. Maks. {maxGuests} kursi per pesanan.{" "}
                <a
                  href={whatsappLink("Halo HOLOLABS, saya ingin memesan untuk rombongan.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-200 underline underline-offset-4"
                >
                  Rombongan lebih besar?
                </a>
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-4">
              <h2 className="hl-display text-2xl font-semibold">{copy.dataTitle}</h2>
              <p className="-mt-2 text-[15px] text-[#a9a3bc]">{copy.dataNote}</p>
              {(
                [
                  { k: "name", label: "Nama lengkap", type: "text", ac: "name", ph: "Nama sesuai identitas", im: "text" },
                  { k: "whatsapp", label: "Nomor WhatsApp", type: "tel", ac: "tel", ph: "08xx xxxx xxxx", im: "tel" },
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
                Gmail
                <span
                  className={`flex min-h-12 w-full items-center rounded-xl border bg-hl-ink pl-4 pr-4 text-base transition focus-within:border-hl-violet focus-within:ring-2 focus-within:ring-hl-violet/40 ${errors.email ? "border-rose-400" : "border-white/15"}`}
                >
                  <input
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="nama kamu"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: gmailLocal(e.target.value) })}
                    aria-invalid={!!errors.email}
                    className="min-w-0 flex-1 bg-transparent py-3 text-hl-fg outline-none placeholder:text-[#7d7790]"
                  />
                  <span className="shrink-0 select-none text-[#a9a3bc]">{GMAIL}</span>
                </span>
                {errors.email ? <span className="text-rose-300">{errors.email}</span> : <span className="text-[#a9a3bc]">{copy.emailHint}</span>}
              </label>
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

          {step === 3 ? (
            <div className="flex flex-col gap-4">
              <h2 className="hl-display text-2xl font-semibold">{copy.termsTitle}</h2>
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

          {step === 4 ? (
            <div className="flex flex-col gap-4">
              <h2 className="hl-display text-2xl font-semibold">{copy.paymentTitle}</h2>
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
                  Nominal ditambah <b>kode unik</b> Rp10–99 supaya transfermu langsung kami kenali. Transfer persis sesuai angka itu.
                </li>
                <li>Tekan &quot;Saya sudah transfer&quot;. E-tiket dikirim setelah tim kami memverifikasi.</li>
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
            {step < LAST_STEP ? (
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
              ["Pertunjukan", "Perjalanan HOLOLABS"],
              ["Tanggal", session ? fmtDate(session.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "–"],
              ["Jam", session ? `${session.startTime.replace(":", ".")} WIB` : "–"],
              ["Kursi", count ? seatList(seats) : "–"],
              ["Tiket", session ? `${count} × ${rupiah(session.price)}` : "–"],
              ...(step >= LAST_STEP ? [["Bayar via", `Transfer ${bank.bank}`]] : []),
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
        {total > 0 ? <p className="mt-2 text-right text-[13px] text-[#a9a3bc]">Nanti ditambah kode unik Rp10–99</p> : null}
      </aside>
    </div>
  );
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const ym = (date: string) => date.slice(0, 7);
const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/**
 * Month calendar for picking the show date. Days with a show that can still
 * be booked are tappable, marked green (or amber when almost full); other
 * days are dimmed. Weeks start on Monday.
 */
function BookingCalendar({ days, value, onChange }: { days: BookingDayView[]; value: string; onChange: (date: string) => void }) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const [month, setMonth] = useState(() => ym(value || first || new Date().toISOString().slice(0, 10)));
  useEffect(() => {
    if (value) setMonth(ym(value));
  }, [value]);

  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const canPrev = !!first && month > ym(first);
  const canNext = !!last && month < ym(last);
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-hl-ink/40 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={!canPrev}
          aria-label="Bulan sebelumnya"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/15 text-lg text-[#d3cee2] transition hover:border-white/40 disabled:cursor-default disabled:opacity-30"
        >
          ‹
        </button>
        <p className="hl-display text-lg font-semibold" aria-live="polite">
          {fmtDate(`${month}-01`, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canNext}
          aria-label="Bulan berikutnya"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/15 text-lg text-[#d3cee2] transition hover:border-white/40 disabled:cursor-default disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7d7790]">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`x${i}`} />;
          const info = byDate.get(d);
          const open = info?.sessions.filter((s) => s.bookable) ?? [];
          const left = open.reduce((sum, s) => sum + s.left, 0);
          const selectable = open.length > 0;
          const active = d === value;
          const label = fmtDate(d, { weekday: "long", day: "numeric", month: "long" });
          return (
            <button
              key={d}
              type="button"
              disabled={!selectable}
              onClick={() => onChange(d)}
              aria-pressed={active}
              aria-label={`${label}, ${selectable ? (left <= 3 ? "hampir penuh" : `${left} kursi tersedia`) : "tidak ada pertunjukan"}`}
              className={`relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl text-[15px] transition ${
                active
                  ? "hl-grad font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,.45)]"
                  : selectable
                    ? "cursor-pointer border border-white/10 bg-white/[0.04] text-hl-fg hover:border-white/40"
                    : "cursor-default text-[#5c5670]"
              } ${d === today && !active ? "ring-1 ring-cyan-300/60" : ""}`}
            >
              {Number(d.slice(8))}
              {selectable && !active ? (
                <span className={`absolute bottom-1.5 size-1 rounded-full ${left <= 3 ? "bg-amber-300" : "bg-emerald-300"}`} />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#a9a3bc]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-300" /> Tersedia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-300" /> Hampir penuh
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full ring-1 ring-cyan-300/60" /> Hari ini
        </span>
      </div>
    </div>
  );
}

/** Longest stretch of free, consecutive seat numbers (seats 1..capacity sit in one row). */
function longestFreeRun(capacity: number, taken: string[]) {
  const set = new Set(taken);
  let best = 0;
  let run = 0;
  for (let i = 1; i <= capacity; i++) {
    run = set.has(String(i)) ? 0 : run + 1;
    best = Math.max(best, run);
  }
  return best;
}

