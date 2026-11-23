import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Printer } from "lucide-react";
import { PrintButton } from "@/components/ticket/print-button";
import { getSiteContent } from "@/lib/cms";
import { getBookingByToken } from "@/lib/services/booking";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatTimeRange } from "@/lib/utils/format";
import { qrDataUrl } from "@/lib/utils/qr";

export const metadata: Metadata = { title: "E-Ticket", robots: { index: false } };

/**
 * The guest's e-ticket once payment is confirmed, shaped like a golden ticket
 * but in the brand colours: a deep violet holographic body with a moving
 * sheen and a perforated stub holding the check-in QR. Horizontal on wide screens and in print,
 * vertical on phones. Unpaid bookings go back to the payment page.
 */
export default async function ETicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();
  if (booking.paymentStatus !== "PAID") redirect(`/pembayaran/${token}`);

  const [qr, { contact }] = await Promise.all([qrDataUrl(booking.bookingNumber), getSiteContent()]);
  const checkedIn = booking.checkinStatus === "CHECKED_IN";
  const seats = booking.seatLabels.length ? booking.seatLabels.join(", ") : "–";
  const address = contact.address
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <section className="relative isolate overflow-hidden px-4 py-12 sm:py-16 print:overflow-visible print:p-0">
      <div aria-hidden className="no-print absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgb(124_58_237/0.22),transparent_70%)]" />

      <div className="no-print mx-auto mb-8 max-w-[46rem] text-center">
        <p className="font-label text-[0.8125rem] uppercase tracking-[0.3em] text-cyan">Pembayaran terkonfirmasi</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Ini e-ticket kamu, {booking.customerFullName.split(" ")[0]}.</h1>
        <p className="mt-2 text-sm leading-7 text-ink-soft">Simpan halaman ini atau cetak sebagai PDF, lalu tunjukkan QR-nya saat check-in.</p>
      </div>

      <div className="print-area mx-auto max-w-[46rem]">
        <div className="gt-shadow">
          <article className="gt-ticket" aria-label={`E-ticket ${booking.bookingNumber}`}>
            {/* main body */}
            <div className="gt-main">
              <div aria-hidden className="gt-frame" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="gt-kicker">HOLOLABS · E-Ticket</p>
                  <p className="gt-title">Experience Journey</p>
                </div>
                <p className="gt-admit">
                  <span>Admit</span>
                  <b>{booking.seats}</b>
                </p>
              </div>

              <p className="gt-tagline relative">Don&apos;t just see the technology. Step inside it.</p>

              <dl className="gt-grid relative">
                <div className="col-span-2">
                  <dt>Atas nama</dt>
                  <dd className="text-lg">{booking.customerFullName}</dd>
                </div>
                <div>
                  <dt>Tanggal</dt>
                  <dd>
                    {formatWeekday(booking.sessionDate)}, {formatDate(booking.sessionDate)}
                  </dd>
                </div>
                <div>
                  <dt>Jam show</dt>
                  <dd>{formatTimeRange(booking.startTime, booking.endTime)}</dd>
                </div>
                <div>
                  <dt>Kursi</dt>
                  <dd>No. {seats}</dd>
                </div>
                <div>
                  <dt>Durasi</dt>
                  <dd>±90 menit</dd>
                </div>
              </dl>

              {address ? <p className="gt-fine relative">{address}</p> : null}
            </div>

            {/* perforated stub with the check-in QR */}
            <div className="gt-stub">
              <div className="gt-qr">
                <Image src={qr} alt={`QR check-in ${booking.bookingNumber}`} width={168} height={168} unoptimized className="size-full" />
              </div>
              <p className="gt-code">{booking.bookingNumber}</p>
              <p className="gt-stub-note">{checkedIn ? "Sudah check-in" : "Scan saat check-in"}</p>
              {checkedIn ? <p className="gt-stamp">Checked in</p> : null}
            </div>
          </article>
        </div>
      </div>

      <div className="no-print mx-auto mt-8 flex max-w-[46rem] flex-col items-center gap-3">
        <ul className="w-full max-w-md space-y-1.5 text-sm leading-6 text-ink-soft">
          <li>Datang 10 menit sebelum show dimulai.</li>
          <li>Satu QR untuk seluruh kursi di pesanan ini.</li>
        </ul>
        <PrintButton className="mt-2 w-full max-w-md">
          <Printer className="size-4" aria-hidden />
          Cetak / Simpan sebagai PDF
        </PrintButton>
      </div>
    </section>
  );
}
