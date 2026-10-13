import { getSql } from "@/lib/db/client";

/**
 * Manual bank transfer — no payment gateway is wired yet (no merchant
 * credentials were available while building this; see the note at the top
 * of db/schema.sql). The payment page shows dummy BCA/Mandiri accounts; the
 * guest confirms on the site itself ("Saya Sudah Transfer", which flips the
 * booking to SUBMITTED) and an admin verifies the transfer and marks it
 * PAID from /admin/bookings. Nothing here hands off to WhatsApp or any
 * other institution's channel.
 *
 * To go live with a real payment gateway, swap this (and
 * `submit_payment_proof`/`admin_mark_paid` in the schema) for the
 * gateway's checkout + webhook — nothing else here needs to change.
 */

export async function createPayment(args: {
  bookingId: string;
  amount: number;
  expiresAt: string;
}): Promise<void> {
  const sql = getSql();
  await sql`select * from create_payment(${args.bookingId}, ${args.amount}, ${args.expiresAt})`;
}

/** Guest self-service: moves a PENDING booking to SUBMITTED ("menunggu konfirmasi"). */
export async function submitPaymentProof(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sql = getSql();
  try {
    await sql`select submit_payment_proof(${token}::uuid)`;
    return { ok: true };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("NOT_ELIGIBLE")) {
      return { ok: false, error: "Booking ini sudah ditransfer atau statusnya sudah berubah." };
    }
    return { ok: false, error: "Gagal menyimpan konfirmasi. Coba lagi sebentar lagi." };
  }
}
