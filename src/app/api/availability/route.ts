import { NextResponse, connection } from "next/server";

import { getSql } from "@/lib/db";

export interface AvailabilitySession {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  seatsLeft: number;
}

export interface AvailabilityPackage {
  id: string;
  name: string;
  price: number;
}

export type AvailabilityResponse =
  | { connected: true; sessions: AvailabilitySession[]; packages: AvailabilityPackage[] }
  | { connected: false };

/**
 * Sisa kursi tiap show dan harga paket, langsung dari basis data.
 *
 * `connection()` memaksa respons dihitung per request: di bawah Cache
 * Components, GET tanpa akses data runtime bisa ikut di-prerender saat
 * build, dan sisa kursi yang dibekukan saat build jelas salah.
 */
export async function GET() {
  await connection();

  const sql = getSql();
  if (!sql) return NextResponse.json({ connected: false } satisfies AvailabilityResponse);

  const [sessions, packages] = await Promise.all([
    sql`
      select id, session_date, start_time, end_time, capacity, seats_taken
      from show_availability
      where session_date::date >= current_date
      order by session_date, slot_index
    `,
    sql`select id, name, price from packages where active order by sort_order`,
  ]);

  return NextResponse.json({
    connected: true,
    sessions: sessions.map((s) => ({
      id: s.id,
      sessionDate: s.session_date,
      startTime: s.start_time,
      endTime: s.end_time,
      capacity: Number(s.capacity),
      seatsLeft: Math.max(0, Number(s.capacity) - Number(s.seats_taken)),
    })),
    packages: packages.map((p) => ({ id: p.id, name: p.name, price: Number(p.price) })),
  } satisfies AvailabilityResponse);
}
