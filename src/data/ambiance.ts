/**
 * "Ambiance" — per the revision notes (Spero x Hololabs, meeting re:
 * Meat Guy Steakhouse reference, Oct 2026): this section introduces the
 * venue/atmosphere only, not the immersive content itself (that's
 * Collection). Kept short — one mood statement plus a few numbers.
 */
export interface AmbianceStat {
  value: string;
  label: string;
}

export const ambianceStats: AmbianceStat[] = [
  { value: "±90 min", label: "Satu Experience Journey" },
  { value: "8", label: "Zona dalam satu ruang" },
  { value: "1–50", label: "Orang / sesi, individu sampai grup" },
];
