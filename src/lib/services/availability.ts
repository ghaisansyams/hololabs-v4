import { asc, eq, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured, rows, schema } from "@/lib/db/client";
import type { Package, SessionAvailability } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(row: any): SessionAvailability {
  return {
    id: row.id,
    sessionDate: row.session_date,
    slotIndex: row.slot_index,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    seatsTaken: row.seats_taken,
    seatsLeft: row.seats_left,
  };
}

/** Every bookable session from today onward, grouped by nobody — the caller groups by date. */
export async function listAvailability(): Promise<SessionAvailability[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return (await rows(sql`select * from list_availability()`)).map(mapSession);
  } catch {
    return [];
  }
}

export async function listPackages(): Promise<Package[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const { packages } = schema;
    const list = await getDb().select().from(packages).where(eq(packages.active, true)).orderBy(asc(packages.sortOrder));
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      includes: p.includes,
      price: Number(p.price),
      sortOrder: p.sortOrder,
    }));
  } catch {
    return [];
  }
}

/** Sessions bucketed by day, in chronological order — what the picker renders. */
export interface DaySchedule {
  date: string;
  sessions: SessionAvailability[];
}

export function groupByDay(sessions: SessionAvailability[]): DaySchedule[] {
  const byDate = new Map<string, SessionAvailability[]>();
  for (const session of sessions) {
    const list = byDate.get(session.sessionDate) ?? [];
    list.push(session);
    byDate.set(session.sessionDate, list);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({
      date,
      sessions: list.sort((a, b) => a.slotIndex - b.slotIndex),
    }));
}
