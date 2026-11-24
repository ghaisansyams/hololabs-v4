"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Mail, TriangleAlert } from "lucide-react";
import { resendETicketEmail } from "@/app/admin/actions";
import type { AdminBookingRow } from "@/lib/services/admin";
import { cn } from "@/lib/utils/cn";

/**
 * E-tickets go out by email only, sent automatically through the Gmail
 * account configured on the server (see lib/services/mailer.ts). Confirming a
 * payment already sends it; this panel shows the state and can send it again.
 */

const stamp = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso))
    : null;

/** A small email icon for the bookings table: green with a check once the e-ticket email went out. */
export function TicketSentChips({ booking }: { booking: AdminBookingRow }) {
  if (booking.paymentStatus !== "PAID" || booking.status === "CANCELLED") {
    return <span className="text-xs text-muted">–</span>;
  }
  const at = stamp(booking.ticketSentEmailAt);
  const off = !booking.email;
  const label = off ? "Tamu tidak mengisi email" : at ? `E-ticket terkirim ${at}` : "E-ticket belum terkirim";
  return (
    <span
      title={label}
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-full border",
        off ? "border-line text-muted/40" : at ? "border-success/45 bg-success-soft text-success" : "border-warning/50 text-warning",
      )}
    >
      <Mail className="size-3.5" aria-hidden />
      {at ? (
        <span aria-hidden className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-success text-canvas">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      ) : null}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function TicketDelivery({ booking, emailReady, notice }: { booking: AdminBookingRow; emailReady: boolean; notice?: string }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [sentAt, setSentAt] = useState(booking.ticketSentEmailAt);
  const [error, setError] = useState(notice ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  useEffect(() => {
    setSentAt(booking.ticketSentEmailAt);
  }, [booking.ticketSentEmailAt]);
  useEffect(() => {
    setError(notice ?? "");
  }, [notice]);

  if (booking.paymentStatus !== "PAID" || booking.status === "CANCELLED") return null;

  const link = `${origin}/e-tiket/${booking.accessToken}`;
  const hasEmail = Boolean(booking.email);

  function send() {
    setError("");
    startTransition(async () => {
      const res = await resendETicketEmail(booking.id);
      if (res.ok) {
        setSentAt(new Date().toISOString());
        router.refresh();
      } else {
        setError(res.error ?? "Email gagal terkirim.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">E-ticket lewat email</p>
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
          Lihat e-ticket
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>

      <p className={cn("mt-2 text-sm font-semibold", sentAt ? "text-success" : hasEmail ? "text-warning" : "text-muted")}>
        {sentAt ? `Terkirim ${stamp(sentAt)} ke ${booking.email}` : hasEmail ? `Belum terkirim ke ${booking.email}` : "Tamu tidak mengisi email, e-ticket tidak bisa dikirim"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Email berisi tombol e-ticket dan QR check-in dikirim otomatis begitu pembayaran dikonfirmasi. Teksnya bisa diubah di Konten Website, bagian Email otomatis.
      </p>

      {!emailReady ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warning-soft px-2.5 py-2 text-xs text-warning">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          Email otomatis belum aktif. Isi GMAIL_USER dan GMAIL_APP_PASSWORD di server, lalu jalankan ulang.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 flex items-start gap-1.5 rounded-lg bg-danger-soft px-2.5 py-2 text-xs text-danger">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={send}
        disabled={pending || !hasEmail || !emailReady}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-pill bg-gradient-to-r from-brand to-accent px-3 py-2.5 text-xs font-bold text-canvas transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mail className="size-3.5" aria-hidden />
        {pending ? "Mengirim…" : sentAt ? "Kirim ulang email" : "Kirim email e-ticket"}
      </button>
    </section>
  );
}
