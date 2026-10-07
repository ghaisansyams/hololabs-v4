import { getSql } from "@/lib/db/client";
import { siteConfig } from "@/data/site";
import { formatRupiah } from "@/lib/utils/format";

/**
 * QRIS is not yet wired to a real payment gateway — no merchant credentials
 * were available while building this (see the note at the top of
 * db/schema.sql). The payment page shows a QR code and the guest confirms
 * via WhatsApp; an admin verifies the transfer and flips the booking to PAID
 * by hand in Neon, the same manual-verification pattern Kelas Bermain uses
 * for bank transfers.
 *
 * To go live with real QRIS, swap `buildQrisPayload` for the payload your
 * PG (Xendit, Midtrans, etc.) gives you and wire its webhook to call
 * `set_payment_status` — nothing else here needs to change.
 */

export async function createPayment(args: {
  bookingId: string;
  amount: number;
  expiresAt: string;
}): Promise<void> {
  const sql = getSql();
  await sql`select * from create_payment(${args.bookingId}, ${args.amount}, ${args.expiresAt})`;
}

/** Demo QRIS payload — encodes a reference string, not a real merchant string. */
export function buildQrisPayload(bookingNumber: string, amount: number): string {
  return `DEMO-QRIS|HOLOMOC EXHIBITION|${bookingNumber}|IDR${amount}`;
}

export function buildWhatsappConfirmationLink(bookingNumber: string, amount: number): string {
  const message = [
    `Halo Admin Hololabs Exhibition, saya sudah membayar untuk booking ${bookingNumber}.`,
    `Total: ${formatRupiah(amount)}.`,
    "Berikut bukti pembayarannya 🙏",
  ].join(" ");
  return `https://wa.me/${siteConfig.whatsappE164}?text=${encodeURIComponent(message)}`;
}
