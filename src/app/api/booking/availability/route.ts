import { NextResponse } from "next/server";
import { getBookingDays } from "@/lib/services/seat-booking";

export const dynamic = "force-dynamic";

/** The 30-day schedule with live seats left, polled by /booking every 30 s. */
export async function GET() {
  const days = await getBookingDays();
  return NextResponse.json({ ok: true, days }, { headers: { "Cache-Control": "no-store" } });
}
