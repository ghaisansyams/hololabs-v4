"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { sendChangeEmail } from "@/app/admin/actions";
import type { AdminBookingRow } from "@/lib/services/admin";
import { cn } from "@/lib/utils/cn";

/**
 * "Kirim email perubahan": the only way the guest hears about an edit made in
 * "Ubah". It shows while the order is flagged as changed, asks once, then
 * sends through the mail account configured on the server.
 */
export function SendChangeButton({ booking, emailReady, className }: { booking: AdminBookingRow; emailReady: boolean; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!booking.changePending || booking.status === "CANCELLED") return null;
  const noEmail = !booking.email;

  function send() {
    if (!window.confirm(`Kirim email perubahan pesanan ${booking.bookingNumber} ke ${booking.email}?`)) return;
    setError("");
    startTransition(async () => {
      const res = await sendChangeEmail(booking.id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Email gagal terkirim.");
    });
  }

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <button
        type="button"
        onClick={send}
        disabled={pending || noEmail || !emailReady}
        title={noEmail ? "Tamu tidak mengisi email" : !emailReady ? "Email otomatis belum aktif di server" : undefined}
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-r from-brand to-accent px-3 text-xs font-bold text-canvas transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mail className="size-3.5" aria-hidden />
        {pending ? "Mengirim…" : "Kirim email perubahan"}
      </button>
      {error ? (
        <p role="alert" className="max-w-56 text-right text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
