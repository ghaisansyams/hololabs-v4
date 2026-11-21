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
  tagline: "Reservasi kursi & paket F&B untuk exhibition Hololabs.",
  description:
    "Pesan kursi dan paket makan-minum untuk exhibition Hololabs secara online. Pilih sesi, sistem otomatis mengarahkan ke slot berikutnya bila penuh, bayar dengan transfer bank, dan datang dengan e-tiket.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004",
  locale: "id-ID",
  email: "",
  whatsapp: "0816712339",
  whatsappE164: "62816712339",
  venueCity: "Jakarta",
  sessionDurationLabel: "± 90 menit per show",
  dailyWindowLabel: "18.00 & 19.30 WIB",
  seatsPerSessionLabel: "18 kursi per show",
} as const;

export interface NavLink {
  href: string;
  label: string;
}

// Meat Guy-style header: logo + a Reservasi button + a hamburger that opens
// a full-screen menu (see SiteHeader). The menu only lists pages that are
// real navigation — Ambiance, Collection, Rundown, Our Story and Cek
// Tiket each have their own route. About Us/Lokasi/FAQ stay off this list
// on purpose: from any other page they'd just be "go back to the
// homepage, then scroll", which felt like the menu was lying about taking
// you somewhere new.
export const mainNav: NavLink[] = [
  { href: "/", label: "Beranda" },
  { href: "/ambiance", label: "Ambiance" },
  { href: "/collection", label: "Collection" },
  { href: "/rundown", label: "Rundown" },
  { href: "/our-story", label: "Our Story" },
  { href: "/cek-tiket", label: "Cek Tiket" },
];

export interface SocialLink {
  label: string;
  handle: string;
  href: string;
  icon: "instagram" | "whatsapp" | "mail";
}
