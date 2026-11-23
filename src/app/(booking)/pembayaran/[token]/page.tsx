import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { HlCopy } from "@/components/booking/hl-copy";
import { HlProofUpload } from "@/components/booking/hl-proof-upload";
import { PaymentCountdown } from "@/components/booking/payment-countdown";
import { getSiteContent } from "@/lib/cms";
import { getBookingByToken } from "@/lib/services/booking";
import { toWhatsappE164 } from "@/lib/utils/phone";
import { cancelOrder, confirmTransfer } from "./actions";

export const metadata: Metadata = { title: "Pembayaran", robots: { index: false } };

const rupiah = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(n);
const fmtDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
const clock = (time: string) => time.slice(0, 5).replace(":", ".");

/** "23 Nov 2026, 14.31 WIB" in Jakarta time, whatever the server's zone. */
function fmtDeadline(iso: string): string {
  const parts = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}.${get("minute")} WIB`;
}

/**
 * Step after "Pesan & lihat rekening", laid out like hololabs.id: the
 * countdown for the 120-minute hold, the account and the exact amount (the
 * unique code taken off, last three digits highlighted), "Sudah transfer?"
 * with the sender's name and an optional proof, step-by-step transfer guides,
 * and the order detail beside it. Once the team verifies the transfer the
 * page forwards to the e-ticket.
 */
export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const [booking, { booking: cfg, contact }] = await Promise.all([getBookingByToken(token), getSiteContent()]);
  if (!booking) notFound();
  if (booking.paymentStatus === "PAID") redirect(`/e-tiket/${token}`);

  const cancelled = booking.paymentStatus === "CANCELLED";
  const expired = booking.paymentStatus === "EXPIRED" || (booking.status === "CANCELLED" && !cancelled);
  const closed = cancelled || expired;
  const waiting = booking.paymentStatus === "SUBMITTED";
  const pending = !closed && !waiting;

  const gross = booking.amount + booking.uniqueCode;
  const unitPrice = booking.seats ? gross / booking.seats : gross;
  const seatText = booking.seatLabels.length ? booking.seatLabels.join(", ") : `${booking.seats} kursi`;
  const wa = toWhatsappE164(contact.whatsapp);
  const waText = `Halo HOLOLABS, saya ingin konfirmasi pembayaran booking ${booking.bookingNumber} sebesar ${rupiah(booking.amount)}.`;

  const amountText = new Intl.NumberFormat("id-ID").format(booking.amount);
  const amountHead = amountText.slice(0, -3);
  const amountTail = amountText.slice(-3);

  const account = cfg.accountNumber || `nomor rekening ${cfg.bank} di atas`;
  const fill = (text: string) => text.replaceAll("{rekening}", account).replaceAll("{atasnama}", cfg.holder).replaceAll("{bank}", cfg.bank);
  const guides = cfg.guides.filter((g) => g.title).map((g) => ({ title: g.title, steps: g.steps.map(fill) }));

  const eyebrow = cancelled ? "PESANAN DIBATALKAN" : expired ? "PESANAN KEDALUWARSA" : waiting ? "MENUNGGU VERIFIKASI" : cfg.payEyebrow;

  return (
    <>
      <div>
        <p className="hl-eyebrow">{eyebrow}</p>
        <h1 className="hl-display mt-3 text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.05]">
          {cancelled ? (
            "Pesanan dibatalkan"
          ) : expired ? (
            "Pesanan kedaluwarsa"
          ) : waiting ? (
            <>
              Terima kasih, <span className="hl-text-grad">kami cek dulu.</span>
            </>
          ) : (
            <>
              {cfg.payTitle} <span className="hl-text-grad">{cfg.payTitleAccent}</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-lg text-[#c9c4d9]">
          {closed
            ? "Kursinya sudah dilepas lagi dan bisa dipesan orang lain."
            : waiting
              ? `Tim HOLOLABS sedang memverifikasi transfermu. Kalau sudah cocok, e-ticket bisa dilihat lewat "Cek status tiket".`
              : cfg.payLead}
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-6">
          <section className="hl-rise overflow-hidden rounded-3xl border border-white/10 bg-hl-panel/85 backdrop-blur">
            {pending && booking.paymentExpiresAt ? (
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
                <span className="text-[14px] text-[#a9a3bc]">Selesaikan transfer dalam</span>
                <span className="hl-display text-2xl font-bold text-cyan-200">
                  <PaymentCountdown expiresAt={booking.paymentExpiresAt} />
                </span>
              </div>
            ) : null}

            {closed ? (
              <div className="flex flex-col gap-4 px-6 py-6 text-[15px] text-rose-100">
                <p>
                  {cancelled
                    ? "Pesanan ini sudah kamu batalkan, jadi kursinya dilepas."
                    : "Waktu pembayaran sudah habis, jadi pesanan ini dibatalkan otomatis dan kursinya dilepas."}
                </p>
                <Link href="/booking" className="hl-grad inline-flex min-h-12 items-center justify-center self-start rounded-full px-8 font-semibold text-white">
                  Pesan lagi
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-7 p-6">
                {error ? (
                  <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-[15px] text-rose-200">
                    {error}
                  </p>
                ) : null}

                <div>
                  <p className="text-[14px] text-[#a9a3bc]">Transfer ke rekening {cfg.bank}</p>
                  {cfg.accountNumber ? (
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <span className="hl-display text-[clamp(28px,4vw,38px)] font-medium leading-none tabular-nums tracking-wide">
                        {cfg.accountNumber}
                      </span>
                      <HlCopy value={cfg.accountNumber.replace(/\s/g, "")} label="Salin" tone="cyan" />
                    </div>
                  ) : (
                    <p className="mt-2 text-[15px] text-amber-100">
                      Nomor rekening belum diisi admin.{" "}
                      <a href={`https://wa.me/${wa}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline underline-offset-4">
                        Minta lewat WhatsApp
                      </a>
                    </p>
                  )}
                  <p className="mt-3 text-[15px] text-[#d3cee2]">
                    a.n. <strong className="font-semibold text-hl-fg">{cfg.holder}</strong> <span className="text-[#a9a3bc]">(HOLOLABS)</span>
                  </p>
                </div>

                <div>
                  <p className="text-[14px] text-[#a9a3bc]">Nominal transfer</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <span className="hl-display text-[clamp(28px,4vw,38px)] font-bold leading-none tabular-nums">
                      Rp {amountHead}
                      <mark className="rounded-md bg-amber-300/25 px-1.5 text-amber-200">{amountTail}</mark>
                    </span>
                    <HlCopy value={String(booking.amount)} label="Salin nominal" />
                  </div>
                  {booking.uniqueCode ? (
                    <p className="mt-4 text-[14px] leading-relaxed text-amber-100">
                      Transfer <strong className="font-semibold">persis {rupiah(booking.amount)}</strong>, termasuk 3 digit terakhir. Angka itu kode unik
                      (potongan {rupiah(booking.uniqueCode).replace("Rp ", "Rp")}) supaya transfermu bisa langsung kami kenali.
                    </p>
                  ) : null}
                  {pending && booking.paymentExpiresAt ? (
                    <p className="mt-2 text-[13px] text-[#a9a3bc]">Batas transfer: {fmtDeadline(booking.paymentExpiresAt)}</p>
                  ) : null}
                </div>

                {pending ? (
                  <form action={confirmTransfer} className="flex flex-col gap-4 border-t border-white/10 pt-6">
                    <input type="hidden" name="token" value={token} />
                    <h2 className="font-[family-name:var(--font-hl-sans)] text-[17px] font-semibold">Sudah transfer?</h2>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="senderName" className="text-[13px] text-[#c9c4d9]">
                        Nama pemilik rekening pengirim (opsional, memudahkan pengecekan)
                      </label>
                      <input
                        id="senderName"
                        name="senderName"
                        type="text"
                        maxLength={80}
                        autoComplete="off"
                        placeholder="mis. Budi Santoso"
                        className="min-h-12 w-full rounded-xl border border-white/15 bg-hl-ink/70 px-4 text-[15px] text-hl-fg placeholder:text-[#6f6a82] focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="proof" className="text-[13px] text-[#c9c4d9]">
                        Bukti transfer: screenshot atau foto struk (opsional)
                      </label>
                      <HlProofUpload />
                    </div>
                    <button
                      type="submit"
                      className="hl-grad min-h-12 cursor-pointer self-start rounded-full px-8 text-base font-semibold text-white transition hover:shadow-[0_0_36px_rgba(139,92,246,.55)]"
                    >
                      Saya sudah transfer
                    </button>
                  </form>
                ) : null}
              </div>
            )}
          </section>

          {!closed && guides.length > 0 ? (
            <section className="rounded-3xl border border-white/10 bg-hl-panel/85 p-6 backdrop-blur">
              <h2 className="hl-display text-xl font-semibold">Cara transfer</h2>
              <div className="mt-5 flex flex-col gap-3">
                {guides.map((g) => (
                  <details key={g.title} open className="group rounded-2xl border border-white/10 bg-hl-ink/40">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                      {g.title}
                      <Plus className="size-4 shrink-0 text-[#a9a3bc] transition-transform duration-300 group-open:rotate-45" aria-hidden />
                    </summary>
                    <ol className="flex list-decimal flex-col gap-2 px-5 pb-5 pl-10 text-[15px] leading-relaxed text-[#d3cee2] marker:text-[#a9a3bc]">
                      {g.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {pending ? (
            <form action={cancelOrder}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="cursor-pointer text-[14px] text-[#a9a3bc] underline underline-offset-4 transition hover:text-white">
                Batalkan pesanan
              </button>
            </form>
          ) : null}
        </div>

        <aside className="rounded-3xl border border-white/10 bg-hl-panel/85 p-6 backdrop-blur lg:sticky lg:top-8">
          <p className="hl-eyebrow">DETAIL PESANAN</p>
          <dl className="mt-4 flex flex-col gap-3 text-[15px]">
            {(
              [
                ["Kode booking", booking.bookingNumber],
                ["Nama", booking.customerFullName],
                ["Tanggal", fmtDate(booking.sessionDate)],
                ["Jam", `${clock(booking.startTime)} – ${clock(booking.endTime)} WIB`],
                ["Kursi", seatText],
                ["Tiket Reguler", `${booking.seats} × ${rupiah(unitPrice)}`],
                ...(booking.uniqueCode ? ([["Kode unik", `−${rupiah(booking.uniqueCode)}`]] as [string, string][]) : []),
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="whitespace-nowrap text-[#a9a3bc]">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
            <span className="text-[#a9a3bc]">Total</span>
            <span className="hl-display text-3xl font-bold tabular-nums">{rupiah(booking.amount)}</span>
          </div>
          {waiting ? (
            <Link href={`/e-tiket/${token}`} className="mt-5 block text-center text-[15px] text-cyan-200 underline-offset-4 hover:underline">
              Cek status tiket →
            </Link>
          ) : null}
        </aside>
      </div>
    </>
  );
}
