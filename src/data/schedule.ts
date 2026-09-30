/**
 * Marketing-page copy of the exhibition run — mirrors the seed range in
 * supabase/schema.sql (2026-10-15 to 2026-10-19). Update both together if
 * the real dates change. Live seat counts are never shown here — only the
 * booking flow at /pesan reads the actual database, so this page can never
 * show a stale or fabricated "kursi tersisa" number.
 */
export const exhibitionDates = ["2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"];

export const dailySlots = [
  { label: "Sesi 1", time: "18.00 – 19.00" },
  { label: "Sesi 2", time: "19.00 – 20.00" },
  { label: "Sesi 3", time: "20.00 – 21.00" },
];
