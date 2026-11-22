import { NextResponse, type NextRequest } from "next/server";
import { getTakenSeats } from "@/lib/services/seat-booking";

export const dynamic = "force-dynamic";

/** Seats already held or sold for one show, polled every 15 s while the map is open. */
export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get("session") ?? "";
  const taken = await getTakenSeats(session);
  if (!taken) return NextResponse.json({ ok: false, error: "Jadwal tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, taken }, { headers: { "Cache-Control": "no-store" } });
}
