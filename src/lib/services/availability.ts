import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
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
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase().rpc("list_availability");
  if (error || !data) return [];
  return (data as unknown[]).map(mapSession);
}

export async function listPackages(): Promise<Package[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as unknown[]).map(mapPackage);
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
