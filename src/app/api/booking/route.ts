import { NextResponse, type NextRequest } from "next/server";
import { createSeatBooking } from "@/lib/services/seat-booking";
import { emailConfigured, sendPaymentInstructionsEmail } from "@/lib/services/mailer";

export const dynamic = "force-dynamic";

/**
 * Places an order: { sessionId, seats, name, email, whatsapp, note, agree }.
 * Answers { ok: true, url } (the payment page) or { ok: false, error,
 * fieldErrors?, taken? } — the same contract as hololabs.id/api/booking.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak valid." }, { status: 400 });
  }
  const str = (v: unknown, max = 400) => (typeof v === "string" ? v.slice(0, max) : "");
  const result = await createSeatBooking({
    sessionId: str(body.sessionId, 64),
    seats: Array.isArray(body.seats) ? body.seats.slice(0, 20).map((s) => String(s).slice(0, 4)) : [],
    name: str(body.name, 120),
    email: str(body.email, 160),
    whatsapp: str(body.whatsapp, 32),
    note: str(body.note, 400),
    agree: body.agree === true,
  });
  if (result.ok) {
    // "Selesaikan transfermu" email; a failed send must never fail the order
    if (emailConfigured()) await sendPaymentInstructionsEmail(result.bookingId).catch(() => {});
    return NextResponse.json({ ok: true, url: result.url });
  }
  const { status, ...rest } = result;
  return NextResponse.json(rest, { status });
}
