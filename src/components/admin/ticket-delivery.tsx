"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ExternalLink, Mail, MessageCircle, TriangleAlert } from "lucide-react";
import { markTicketSent } from "@/app/admin/actions";
import type { AdminBookingRow } from "@/lib/services/admin";
import { fillETicketTemplate, type ETicketTemplates } from "@/lib/utils/eticket-message";
import { toWhatsappE164 } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";

/**
 * Sends a paid guest their e-ticket without any messaging API: the buttons
 * open WhatsApp (wa.me) or a Gmail compose window already filled in from the
 * templates in the CMS, staff press send there, and the time is recorded on
 * the booking. The link uses the address the admin is browsing on, so open
 * the admin through the public domain (or the LAN IP when testing), not
 * localhost.
 */

const stamp = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso))
    : null;

/** Two small icons for the bookings table: WhatsApp and email, green once sent. */
export function TicketSentChips({ booking }: { booking: AdminBookingRow }) {
  if (booking.paymentStatus !== "PAID" || booking.status === "CANCELLED") {
    return <span className="text-xs text-muted">–</span>;
  }
  const items = [
    { key: "wa", label: "WhatsApp", Icon: MessageCircle, at: stamp(booking.ticketSentWaAt), off: false },
    { key: "email", label: "Email", Icon: Mail, at: stamp(booking.ticketSentEmailAt), off: !booking.email },
  ] as const;
  return (
    <ul className="flex items-center gap-1.5">
      {items.map(({ key, label, Icon, at, off }) => (
        <li
          key={key}
          title={off ? "Tamu tidak mengisi email" : at ? `${label}: terkirim ${at}` : `${label}: belum dikirim`}
          className={cn(
            "relative flex size-8 items-center justify-center rounded-full border",
            off ? "border-line text-muted/40" : at ? "border-success/45 bg-success-soft text-success" : "border-line text-muted",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {at ? (
            <span aria-hidden className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-success text-canvas">
              <Check className="size-2.5" strokeWidth={3.5} />
            </span>
          ) : null}
          <span className="sr-only">{off ? `${label}: tanpa email` : at ? `${label}: terkirim ${at}` : `${label}: belum dikirim`}</span>
        </li>
      ))}
    </ul>
  );
}

export function TicketDelivery({ booking, templates }: { booking: AdminBookingRow; templates: ETicketTemplates }) {
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
  const waText = fillETicketTemplate(templates.waMessage, booking, link);
  const subject = fillETicketTemplate(templates.emailSubject, booking, link);
  const body = fillETicketTemplate(templates.emailBody, booking, link);
  const waHref = `https://wa.me/${toWhatsappE164(booking.whatsapp)}?text=${encodeURIComponent(waText)}`;
  const sender = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((templates.gmailSender ?? "").trim()) ? (templates.gmailSender ?? "").trim() : "";
  const gmailHref = `https://mail.google.com/mail/?${sender ? `authuser=${encodeURIComponent(sender)}&` : ""}view=cm&fs=1&to=${encodeURIComponent(booking.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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
          "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-2.5 text-xs font-bold transition",
          disabled
            ? "cursor-not-allowed border border-line text-muted"
            : isWa
              ? "bg-success text-canvas hover:opacity-90"
              : "bg-[#ea4335] text-white hover:opacity-90",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {disabled ? "Tanpa email" : done ? (isWa ? "Kirim ulang WA" : "Kirim ulang Gmail") : isWa ? "Kirim via WA" : "Kirim via Gmail"}
      </a>
    );
  };

  return (
    <section className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Kirim e-ticket</p>
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
          Lihat e-ticket
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Tombol membuka WhatsApp atau Gmail dengan pesan dan tautan e-ticket yang sudah terisi. Tekan kirim di sana. Teks pesan bisa diubah di Konten Website, bagian Pesan e-ticket.
      </p>
      {local ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warning-soft px-2.5 py-2 text-xs text-warning">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          Admin sedang dibuka lewat localhost, jadi tautan e-ticket tidak bisa dibuka tamu. Buka admin lewat domain website (atau IP jaringan saat uji coba).
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {channelButton("wa")}
        {channelButton("email")}
      </div>
      {sender ? (
        <p className="mt-2 text-xs text-muted">
          Email dikirim dari <span className="font-semibold text-ink-soft">{sender}</span>. Admin harus sudah login ke akun Google itu di browser ini.
        </p>
      ) : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted">WhatsApp {booking.whatsapp}</dt>
          <dd className={sent.wa ? "font-semibold text-success" : "text-warning"}>{stamp(sent.wa) ? `Terkirim ${stamp(sent.wa)}` : "Belum dikirim"}</dd>
        </div>
        <div>
          <dt className="truncate text-muted">Email {booking.email}</dt>
          <dd className={sent.email ? "font-semibold text-success" : "text-warning"}>
            {stamp(sent.email) ? `Terkirim ${stamp(sent.email)}` : booking.email ? "Belum dikirim" : "Tamu tidak mengisi email"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
