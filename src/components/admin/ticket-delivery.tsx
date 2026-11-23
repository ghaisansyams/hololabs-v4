"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ExternalLink, Mail, MessageCircle, TriangleAlert } from "lucide-react";
import { markTicketSent } from "@/app/admin/actions";
import type { AdminBookingRow } from "@/lib/services/admin";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatTimeRange } from "@/lib/utils/format";
import { toWhatsappE164 } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";

/**
 * Sends a paid guest their golden e-ticket without any messaging API: the
 * buttons open WhatsApp (wa.me) or a Gmail compose window already filled in,
 * staff press send there, and the time is recorded on the booking. The link
 * uses the address the admin is browsing on, so open the admin through the
 * public domain (or the LAN IP when testing), not localhost.
 */

const stamp = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso))
    : null;

function messages(b: AdminBookingRow, link: string) {
  const when = `${formatWeekday(b.sessionDate)}, ${formatDate(b.sessionDate)}, ${formatTimeRange(b.startTime, b.endTime)}`;
  const seats = b.seatLabels?.length ? `No. ${b.seatLabels.join(", ")} (${b.seats} orang)` : `${b.seats} orang`;
  const wa = [
    `Halo Kak ${b.customerName}!`,
    "",
    `Pembayaran booking *${b.bookingNumber}* sudah kami terima. Ini golden ticket kamu untuk HOLOLABS Experience Journey:`,
    link,
    "",
    `Jadwal: ${when}`,
    `Kursi: ${seats}`,
    "",
    "Tunjukkan QR di e-ticket saat check-in, dan datang 10 menit sebelum show dimulai.",
    "Sampai ketemu di HOLOLABS!",
  ].join("\n");
  const subject = `Golden Ticket HOLOLABS · ${b.bookingNumber}`;
  const body = [
    `Halo ${b.customerName},`,
    "",
    `Pembayaran untuk booking ${b.bookingNumber} sudah kami terima. Golden ticket kamu bisa dibuka di tautan ini:`,
    link,
    "",
    `Jadwal  : ${when}`,
    `Kursi   : ${seats}`,
    `Atas nama: ${b.customerName}`,
    "",
    "Tunjukkan QR di e-ticket saat check-in, dan datang 10 menit sebelum show dimulai. E-ticket juga bisa disimpan sebagai PDF dari halaman tersebut.",
    "",
    "Sampai ketemu di HOLOLABS!",
    "Tim HOLOLABS",
  ].join("\n");
  return { wa, subject, body };
}

export function TicketDelivery({ booking, compact = false }: { booking: AdminBookingRow; compact?: boolean }) {
  const [origin, setOrigin] = useState("");
  const [sent, setSent] = useState({ wa: booking.ticketSentWaAt, email: booking.ticketSentEmailAt });
  const [, startTransition] = useTransition();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  useEffect(() => {
    setSent({ wa: booking.ticketSentWaAt, email: booking.ticketSentEmailAt });
  }, [booking.ticketSentWaAt, booking.ticketSentEmailAt]);

  if (booking.paymentStatus !== "PAID" || booking.status === "CANCELLED") return null;

  const link = `${origin}/e-tiket/${booking.accessToken}`;
  const local = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(origin);
  const { wa, subject, body } = messages(booking, link);
  const waHref = `https://wa.me/${toWhatsappE164(booking.whatsapp)}?text=${encodeURIComponent(wa)}`;
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(booking.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function record(channel: "wa" | "email") {
    setSent((s) => ({ ...s, [channel]: new Date().toISOString() }));
    startTransition(() => markTicketSent(booking.id, channel));
  }

  const channelButton = (channel: "wa" | "email") => {
    const isWa = channel === "wa";
    const done = isWa ? sent.wa : sent.email;
    const disabled = !isWa && !booking.email;
    const Icon = isWa ? MessageCircle : Mail;
    return (
      <a
        href={disabled ? undefined : isWa ? waHref : gmailHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) e.preventDefault();
          else record(channel);
        }}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-pill px-3 py-2 text-xs font-bold transition",
          disabled
            ? "cursor-not-allowed border border-line text-muted"
            : isWa
              ? "bg-success text-canvas hover:opacity-90"
              : "bg-[#ea4335] text-white hover:opacity-90",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {disabled ? "Tanpa email" : done ? (isWa ? "Kirim ulang WA" : "Kirim ulang Gmail") : isWa ? "Kirim via WhatsApp" : "Kirim via Gmail"}
      </a>
    );
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {(["wa", "email"] as const).map((ch) => {
          const at = stamp(ch === "wa" ? sent.wa : sent.email);
          return (
            <span
              key={ch}
              title={at ? `Terkirim ${at}` : "Belum dikirim"}
              className={cn(
                "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[0.6875rem] font-semibold",
                at ? "border-success/40 bg-success-soft text-success" : "border-warning/40 text-warning",
              )}
            >
              {at ? <Check className="size-3" aria-hidden /> : null}
              {ch === "wa" ? "WA" : "Email"}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[#d4a940]/40 bg-gradient-to-br from-[#d4a940]/12 to-transparent p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#f3d77a]">Kirim golden ticket</p>
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
          Lihat e-ticket
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
      <p className="mt-1 text-xs text-muted">
        Tombol membuka WhatsApp atau Gmail dengan pesan dan tautan e-ticket yang sudah terisi. Tekan kirim di sana.
      </p>
      {local ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warning-soft px-2.5 py-2 text-xs text-warning">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          Admin sedang dibuka lewat localhost, jadi tautan e-ticket tidak bisa dibuka tamu. Buka admin lewat domain website (atau IP jaringan saat uji coba).
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        {channelButton("wa")}
        {channelButton("email")}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted">WhatsApp</dt>
          <dd className={sent.wa ? "font-semibold text-success" : "text-warning"}>{stamp(sent.wa) ? `Terkirim ${stamp(sent.wa)}` : "Belum dikirim"}</dd>
        </div>
        <div>
          <dt className="text-muted">Email</dt>
          <dd className={sent.email ? "font-semibold text-success" : "text-warning"}>
            {stamp(sent.email) ? `Terkirim ${stamp(sent.email)}` : booking.email ? "Belum dikirim" : "Tamu tidak mengisi email"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
