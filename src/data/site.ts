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

export const mainNav: NavLink[] = [
  { href: "/", label: "Beranda" },
  { href: "/#jadwal", label: "Jadwal & Paket" },
  { href: "/pesan", label: "Pesan Tiket" },
  { href: "/cek-tiket", label: "Cek Tiket" },
];

export interface SocialLink {
  label: string;
  handle: string;
  href: string;
  icon: "instagram" | "whatsapp" | "mail";
}

export const socialLinks: SocialLink[] = [
  {
    label: "WhatsApp Admin",
    handle: siteConfig.whatsapp,
    href: `https://wa.me/${siteConfig.whatsappE164}`,
    icon: "whatsapp",
  },
  {
    label: "Email",
    handle: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    icon: "mail",
  },
  {
    label: "Instagram",
    handle: "@hololabs.exhibition",
    href: "https://instagram.com/hololabs.exhibition",
    icon: "instagram",
  },
];

export interface ValueProp {
  title: string;
  description: string;
  icon: "clock" | "users" | "bank" | "route";
}

export const valueProps: ValueProp[] = [
  {
    title: "Kuota real-time",
    description:
      "Setiap sesi menampilkan sisa kursi yang sebenarnya, langsung dari sistem — tidak ada kuota ganda atau rebutan di lokasi.",
    icon: "users",
  },
  {
    title: "Auto-routing slot",
    description:
      "Kalau sesi yang kamu pilih kursinya tidak cukup, sistem otomatis mengarahkan ke sesi berikutnya yang masih tersedia — tanpa perlu bolak-balik memilih.",
    icon: "route",
  },
  {
    title: "Bayar transfer bank",
    description: "Transfer ke rekening yang tertera, konfirmasi langsung di halaman pembayaran — tiket kamu aktif begitu admin memverifikasi.",
    icon: "bank",
  },
  {
    title: "Satu show, pengalaman penuh",
    description: "Tiap show berdurasi 1,5 jam, mengikuti rangkaian lengkap dari awal sampai akhir — tidak berdesakan.",
    icon: "clock",
  },
];

export const howItWorks = [
  {
    title: "Pilih tanggal & show",
    description: "Lihat jadwal harian (18.00–21.00 WIB, 2 show) dan sisa kursi tiap show secara langsung.",
  },
  {
    title: "Pilih paket F&B",
    description: "Tentukan jumlah kursi dan paket makan-minum yang sesuai untuk rombonganmu.",
  },
  {
    title: "Bayar via transfer bank",
    description: "Transfer ke rekening yang tertera, lalu tekan \"Saya Sudah Transfer\" di halaman pembayaran.",
  },
  {
    title: "Datang dengan e-tiket",
    description: "Setelah admin memverifikasi, e-tiket berisi QR check-in tersedia untuk ditunjukkan di lokasi.",
  },
];
