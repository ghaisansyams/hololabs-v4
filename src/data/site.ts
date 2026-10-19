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

// The footer keeps the fuller sitemap-style list (mirrors the reference's
// "Pages" footer column) — a footer listing in-page anchors is a normal
// pattern, unlike a "menu" that implies real navigation.
export const footerNav: NavLink[] = [
  { href: "/ambiance", label: "Ambiance" },
  { href: "/collection", label: "Collection" },
  { href: "/rundown", label: "Rundown" },
  { href: "/our-story", label: "Our Story" },
  { href: "/#about", label: "About Us" },
  { href: "/#lokasi", label: "Lokasi" },
  { href: "/#faq", label: "FAQ" },
  { href: "/cek-tiket", label: "Cek Tiket" },
];

export interface SocialLink {
  label: string;
  handle: string;
  href: string;
  icon: "instagram" | "whatsapp" | "mail";
}
