/**
 * Global site configuration for the Holomoc Exhibition booking engine.
 *
 * Built by Spero (PT Spero Mahakarya Nusantara) for Holomoc, per the
 * 16 Sept 2026 meeting notes: an Event Registration & Seat Booking system
 * for Holomoc Exhibition, revenue-shared between the two companies. Holomoc
 * owns the exhibition and its on-site operations; this site is purely the
 * booking engine (see the notes' "pemisahan entitas" point).
 */

export const siteConfig = {
  name: "Holomoc Exhibition",
  shortName: "Holomoc",
  legalName: "Holomoc Exhibition — Booking Engine",
  builtBy: "Spero",
  motto: "Reserve your seat. Save your spot.",
  tagline: "Reservasi kursi & paket F&B untuk Holomoc Exhibition.",
  description:
    "Pesan kursi dan paket makan-minum untuk Holomoc Exhibition secara online. Pilih sesi, sistem otomatis mengarahkan ke slot berikutnya bila penuh, bayar dengan QRIS, dan datang dengan e-tiket.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketing-halomoc.vercel.app",
  locale: "id-ID",
  email: "hello@holomoc.id",
  whatsapp: "081774918611",
  whatsappE164: "6281774918611",
  venueCity: "Jakarta",
  sessionDurationLabel: "1 jam per sesi",
  dailyWindowLabel: "18.00 – 21.00 WIB",
  seatsPerSessionLabel: "Maks. 13 kursi per sesi",
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
    handle: "@holomoc.exhibition",
    href: "https://instagram.com/holomoc.exhibition",
    icon: "instagram",
  },
];

export interface ValueProp {
  title: string;
  description: string;
  icon: "clock" | "users" | "qr" | "route";
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
    title: "Bayar dengan QRIS",
    description: "Scan, bayar, kirim konfirmasi lewat WhatsApp — tiket kamu aktif begitu admin memverifikasi.",
    icon: "qr",
  },
  {
    title: "Satu jam, fokus penuh",
    description: "Tiap sesi berdurasi satu jam agar suasana tetap nyaman dan tidak berdesakan.",
    icon: "clock",
  },
];

export const howItWorks = [
  {
    title: "Pilih tanggal & sesi",
    description: "Lihat jadwal harian (18.00–21.00 WIB, 3 sesi) dan sisa kursi tiap sesi secara langsung.",
  },
  {
    title: "Pilih paket F&B",
    description: "Tentukan jumlah kursi dan paket makan-minum yang sesuai untuk rombonganmu.",
  },
  {
    title: "Bayar via QRIS",
    description: "Selesaikan pembayaran dengan QRIS, lalu kirim bukti lewat tombol WhatsApp yang muncul otomatis.",
  },
  {
    title: "Datang dengan e-tiket",
    description: "Setelah admin memverifikasi, e-tiket berisi QR check-in tersedia untuk ditunjukkan di lokasi.",
  },
];
