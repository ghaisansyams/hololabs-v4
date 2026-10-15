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
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hololabs-id.vercel.app",
  locale: "id-ID",
  email: "hello@hololabs.id",
  whatsapp: "081774918611",
  whatsappE164: "6281774918611",
  venueCity: "Jakarta",
  sessionDurationLabel: "1,5 jam per show",
  dailyWindowLabel: "18.00 – 21.00 WIB",
  seatsPerSessionLabel: "Maks. 13 kursi per show",
} as const;

export interface NavLink {
  href: string;
  label: string;
}

// Minimal, Meat Guy-style nav: the page is a single narrative read top to
// bottom, so the header only needs to get someone to the reservation screen
// or let them check a ticket they already booked.
// Minimal, Meat Guy-style header: the page is a single narrative read top
// to bottom, so the header nav only needs one way out to check a ticket
// already booked — the dedicated "Reservasi" button covers the rest.
export const mainNav: NavLink[] = [{ href: "/cek-tiket", label: "Cek Tiket" }];

// The footer gets the fuller sitemap-style list instead (mirrors the
// reference's "Pages" footer column).
export const footerNav: NavLink[] = [
  { href: "/#about", label: "About Us" },
  { href: "/#jadwal", label: "Jadwal" },
  { href: "/#faq", label: "FAQ" },
  { href: "/cek-tiket", label: "Cek Tiket" },
];

export interface SocialLink {
  label: string;
  handle: string;
  href: string;
  icon: "instagram" | "whatsapp" | "mail";
}
