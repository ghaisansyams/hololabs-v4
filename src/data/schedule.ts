/**
 * Marketing-page copy of the exhibition run — mirrors the seed range in
 * db/schema.sql (2026-10-15 to 2026-10-19). Update both together if the
 * real dates change. Live seat counts are never shown here — only the
 * booking flow at /pesan reads the actual database, so this page can never
 * show a stale or fabricated "kursi tersisa" number.
 *
 * Two 1.5-hour shows per day (not three 1-hour slots) since the client's
 * 7 Oct 2026 WhatsApp revision — each show is the full 7-step journey, not
 * a standalone seating slot.
 */
export const exhibitionDates = ["2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"];

export const dailySlots = [
  { label: "Show 1", time: "18.00 – 19.30" },
  { label: "Show 2", time: "19.30 – 21.00" },
];
