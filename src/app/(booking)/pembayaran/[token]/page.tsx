import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HlCopy } from "@/components/booking/hl-copy";
import { HlProofUpload } from "@/components/booking/hl-proof-upload";
import { PaymentCountdown } from "@/components/booking/payment-countdown";
import { getSiteContent } from "@/lib/cms";
import { getBookingByToken } from "@/lib/services/booking";
import { toWhatsappE164 } from "@/lib/utils/phone";
import { confirmTransfer } from "./actions";

export const metadata: Metadata = { title: "Pembayaran", robots: { index: false } };

const rupiah = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(n);
const fmtDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

/**
 * Step after "Pesan & lihat rekening": the account and exact amount (with
 * the unique code taken off), a countdown for the 120-minute hold, and
 * "Saya sudah transfer" with an optional proof. Once the team verifies the
 * transfer the page forwards to the e-ticket.
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

  const expired = booking.paymentStatus === "EXPIRED" || booking.status === "CANCELLED";
  const waiting = booking.paymentStatus === "SUBMITTED";
  const pending = !expired && !waiting;
  const gross = booking.amount + booking.uniqueCode;
  const unitPrice = booking.seats ? gross / booking.seats : gross;
  const seatText = booking.seatLabels.length ? booking.seatLabels.join(", ") : `${booking.seats} kursi`;
  const wa = toWhatsappE164(contact.whatsapp);
  const waText = `Halo HOLOLABS, saya ingin konfirmasi pembayaran booking ${booking.bookingNumber} sebesar ${rupiah(booking.amount)}.`;

  return (
    <>
      <div>
        <p className="hl-eyebrow">PEMBAYARAN</p>
        <h1 className="hl-display mt-3 text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.05]">
          {expired ? "Pesanan kedaluwarsa" : waiting ? "Menunggu verifikasi" : <>Selesaikan <span className="hl-text-grad">pembayaran</span></>}
        </h1>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="hl-rise flex flex-col gap-6 rounded-3xl border border-white/10 bg-hl-panel/85 p-5 backdrop-blur sm:p-7">
          {pending && booking.paymentExpiresAt ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-4">
              <span className="text-[15px] text-amber-100">Kursi ditahan untukmu. Selesaikan transfer dalam</span>
              <span className="hl-display text-2xl font-semibold text-amber-200">
                <PaymentCountdown expiresAt={booking.paymentExpiresAt} />
              </span>
            </div>
          ) : null}
          {waiting ? (
            <p className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-5 py-4 text-[15px] leading-relaxed text-emerald-100">
              Terima kasih! Konfirmasi transfermu sudah kami terima. Tim HOLOLABS sedang memverifikasi, lalu e-ticket dikirim ke{" "}
              {booking.customerEmail || "email kamu"}.
            </p>
          ) : null}
          {expired ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-[15px] text-rose-100">
              Waktu pembayaran sudah habis, jadi pesanan ini dibatalkan otomatis dan kursinya dilepas.
              <Link href="/booking" className="hl-grad inline-flex min-h-12 items-center justify-center self-start rounded-full px-8 font-semibold text-white">
                Pesan lagi
              </Link>
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-[15px] text-rose-200">
              {error}
            </p>
          ) : null}

          {!expired ? (
            <>
              <div>
                <p className="text-[13px] text-[#a9a3bc]">Transfer tepat sebesar</p>
                <div className="mt-1 flex flex-wrap items-center gap-4">
                  <span className="hl-display text-[clamp(34px,5vw,48px)] font-bold leading-none">{rupiah(booking.amount)}</span>
                  <HlCopy value={String(booking.amount)} label="Salin nominal" />
                </div>
                {booking.uniqueCode ? (
                  <dl className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-[15px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#a9a3bc]">
                        Tiket {booking.seats} × {rupiah(unitPrice)}
                      </dt>
                      <dd>{rupiah(gross)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#a9a3bc]">Kode unik</dt>
                      <dd className="text-emerald-300">− {rupiah(booking.uniqueCode)}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>

              <div className="flex flex-col gap-1 rounded-2xl border border-hl-violet bg-hl-violet/15 p-5 shadow-[0_0_30px_rgba(139,92,246,.25)]">
                <span className="text-[13px] text-[#c9c4d9]">Transfer bank {cfg.bank}</span>
                {cfg.accountNumber ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="hl-display text-2xl font-semibold tabular-nums tracking-wide">{cfg.accountNumber}</span>
                    <HlCopy value={cfg.accountNumber.replace(/\s/g, "")} label="Salin rekening" />
                  </div>
                ) : (
                  <span className="text-[15px] text-amber-100">
                    Nomor rekening belum diisi admin.{" "}
                    <a href={`https://wa.me/${wa}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline underline-offset-4">
                      Minta lewat WhatsApp
                    </a>
                  </span>
                )}
                <span className="text-[14px] text-[#d3cee2]">a.n. {cfg.holder}</span>
              </div>

              <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed text-[#d3cee2]">
                <li>Transfer persis {rupiah(booking.amount)}, termasuk kode unik, dari bank mana pun, m-banking, atau e-wallet.</li>
                <li>Tekan &quot;Saya sudah transfer&quot; di bawah. Bukti transfer boleh diunggah, tidak wajib.</li>
                <li>E-ticket dikirim ke email setelah tim kami memverifikasi transfermu.</li>
              </ol>

              {pending ? (
                <form action={confirmTransfer} className="flex flex-col gap-4">
                  <input type="hidden" name="token" value={token} />
                  <HlProofUpload />
                  <button
                    type="submit"
                    className="hl-grad min-h-12 cursor-pointer rounded-full px-8 text-base font-semibold text-white transition hover:shadow-[0_0_36px_rgba(139,92,246,.55)] sm:self-end"
                  >
                    Saya sudah transfer
                  </button>
                </form>
              ) : null}
            </>
          ) : null}
        </section>

        <aside className="rounded-3xl border border-white/10 bg-hl-panel/85 p-6 backdrop-blur lg:sticky lg:top-6">
          <p className="hl-eyebrow">RINGKASAN</p>
          <dl className="mt-4 flex flex-col gap-3 text-[15px]">
            {(
              [
                ["Kode booking", booking.bookingNumber],
                ["Show", "HOLOLABS Experience Journey"],
                ["Tanggal", fmtDate(booking.sessionDate)],
                ["Jam", `${booking.startTime.slice(0, 5).replace(":", ".")} WIB`],
                ["Kursi", seatText],
                ["Pemesan", booking.customerFullName],
                ["Status", expired ? "Kedaluwarsa" : waiting ? "Menunggu verifikasi" : "Menunggu transfer"],
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
            <span className="hl-display text-3xl font-bold">{rupiah(booking.amount)}</span>
          </div>
          <Link href={`/e-tiket/${token}`} className="mt-5 block text-center text-[15px] text-cyan-200 underline-offset-4 hover:underline">
            Cek status tiket →
          </Link>
        </aside>
      </div>
    </>
  );
}
