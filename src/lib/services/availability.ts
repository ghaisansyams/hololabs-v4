import { getSql, isDatabaseConfigured } from "@/lib/db/client";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPackage(row: any): Package {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    includes: row.includes ?? [],
    price: Number(row.price),
    sortOrder: row.sort_order,
  };
}

/** Every bookable session from today onward, grouped by nobody — the caller groups by date. */
export async function listAvailability(): Promise<SessionAvailability[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const sql = getSql();
    const rows = await sql`select * from list_availability()`;
    return (rows as unknown[]).map(mapSession);
  } catch {
    return [];
  }
}

export async function listPackages(): Promise<Package[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const sql = getSql();
    const rows = await sql`select * from packages where active = true order by sort_order asc`;
    return (rows as unknown[]).map(mapPackage);
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
