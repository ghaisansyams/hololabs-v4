import type { Package } from "@/lib/types";

/**
 * Marketing-page copy of the F&B package catalogue — mirrors the seed rows
 * in supabase/schema.sql exactly, so the landing page reads well even before
 * a database is wired up. The booking flow itself always reads the live
 * `packages` table (see lib/services/availability.ts), never this file, so
 * an admin changing a price in Supabase can never drift from what a guest
 * actually pays.
 */
export const packagesPreview: Package[] = [
  {
    id: "seat-only",
    name: "Seat Only",
    description: "Masuk pameran dan kursi tereservasi, tanpa paket F&B.",
    includes: ["Akses show 1,5 jam", "Kursi tereservasi"],
    price: 75_000,
    sortOrder: 1,
  },
  {
    id: "standard",
    name: "Standard F&B",
    description: "Kursi tereservasi plus satu paket makanan & minuman ringan.",
    includes: [
      "Akses show 1,5 jam",
      "Kursi tereservasi",
      "1 pilihan makanan (dimsum/tahu)",
      "1 pilihan minuman",
    ],
    price: 150_000,
    sortOrder: 2,
  },
  {
    id: "premium",
    name: "Premium F&B",
    description: "Pengalaman lengkap: kursi terbaik dan sajian F&B tanpa batas selama sesi.",
    includes: [
      "Akses show 1,5 jam",
      "Kursi prioritas",
      "Aneka makanan (dimsum, tahu, camilan lain)",
      "Minuman bebas pilih & refill",
    ],
    price: 250_000,
    sortOrder: 3,
  },
];
