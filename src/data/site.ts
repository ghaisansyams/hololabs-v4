/**
 * Global site configuration for the Hololabs booking engine.
 *
 * Built by Spero (PT Spero Mahakarya Nusantara) for Hololabs, per the
 * 16 Sept 2026 meeting notes: an Event Registration & Seat Booking system
 * for the Hololabs exhibition, revenue-shared between the two companies.
 * Hololabs owns the exhibition and its on-site operations; this site is
 * purely the booking engine (see the notes' "pemisahan entitas" point).
 *
 * Renamed from "Holomoc" to "Hololabs" per the client's request on
 * 7 Oct 2026. The brand name itself is just "Hololabs" — "Exhibition" was
 * dropped from the display name on 7 Oct 2026 too (the real logo, supplied
 * the same day, reads "HOLOLABS" with no "Exhibition" in the lockup);
 * "exhibition"/"pameran" still appears in body copy as the descriptive noun
 * for the event itself.
 */

export const siteConfig = {
  name: "Hololabs",
  shortName: "Hololabs",
  legalName: "Hololabs — Booking Engine",
  builtBy: "Spero",
  motto: "Reserve your seat. Save your spot.",
  tagline: "Reservasi kursi pertunjukan dan paket makanan-minuman di Hololabs.",
  description:
    "Pesan kursi dan paket makan-minum untuk pertunjukan Hololabs secara daring. Pilih jadwal, sistem otomatis mengarahkan ke jadwal berikutnya bila penuh, bayar dengan transfer bank, dan datang dengan e-tiket.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004",
  locale: "id-ID",
  email: "",
  whatsapp: "0816712339",
  whatsappE164: "62816712339",
  venueCity: "Jakarta",
  sessionDurationLabel: "± 90 menit per pertunjukan",
  dailyWindowLabel: "18.00 & 19.30 WIB",
  seatsPerSessionLabel: "18 kursi per pertunjukan",
} as const;

export interface NavLink {
  href: string;
  label: string;
}

// Header and footer links, same anchors as hololabs.id (Tentang, Journey, Info,
// FAQ) plus the ticket lookup. Editable in the CMS (Menu & tombol).
export const mainNav: NavLink[] = [
  { href: "/#about", label: "Tentang" },
  { href: "/#showroom", label: "Denah" },
  { href: "/#journey", label: "Perjalanan" },
  { href: "/#reservasi", label: "Info" },
  { href: "/#faq", label: "Tanya Jawab" },
];

export interface SocialLink {
  label: string;
  handle: string;
  href: string;
  icon: "instagram" | "whatsapp" | "mail";
}
