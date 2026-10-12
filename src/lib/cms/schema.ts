import { valueProps, howItWorks, siteConfig } from "@/data/site";
import { journeySteps, journeyDurationLabel } from "@/data/journey";
import { serviceCategories } from "@/data/services";

/**
 * Editable website content (CMS).
 *
 * Each section is a flat object of strings plus, at most, lists of small
 * objects. `fields` drives both the admin editor and server-side
 * validation; `defaults` is exactly what the site showed before the CMS
 * existed, so nothing changes on the page until an admin saves an edit.
 */

export type TextField = { key: string; label: string; type: "text" | "textarea"; max?: number };
export type TagsField = { key: string; label: string; type: "tags"; hint?: string };
export type ListField = {
  key: string;
  label: string;
  type: "list";
  itemLabel: string;
  fields: (TextField | TagsField)[];
  min?: number;
  max?: number;
};
export type FieldDef = TextField | TagsField | ListField;

export interface SectionDef {
  key: string;
  label: string;
  description: string;
  fields: FieldDef[];
}

const t = (key: string, label: string, max = 160): TextField => ({ key, label, type: "text", max });
const ta = (key: string, label: string, max = 600): TextField => ({ key, label, type: "textarea", max });

export const sections = [
  {
    key: "hero",
    label: "Hero (bagian paling atas)",
    description: "Judul besar, kalimat pembuka, tombol, dan tiga angka di bawahnya.",
    fields: [
      t("badge", "Label kecil di atas judul"),
      t("title", "Judul (bagian putih)"),
      t("titleAccent", "Judul (bagian berwarna gradien)"),
      t("titleSuffix", "Judul (akhiran, mis. titik)", 20),
      ta("lead", "Kalimat pembuka"),
      t("ctaPrimary", "Teks tombol utama", 40),
      t("ctaSecondary", "Teks tombol kedua", 40),
      {
        key: "stats",
        label: "Angka di bawah tombol",
        type: "list",
        itemLabel: "Angka",
        min: 0,
        max: 4,
        fields: [t("value", "Angka / teks besar", 30), t("label", "Keterangan", 40)],
      },
      ta("previewNote", "Catatan di kartu Live preview", 300),
    ],
  },
  {
    key: "valueProps",
    label: "Kenapa pesan online",
    description: "Empat kartu keunggulan di bawah hero.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      {
        key: "items",
        label: "Kartu",
        type: "list",
        itemLabel: "Kartu",
        min: 1,
        max: 8,
        fields: [t("title", "Judul kartu", 80), ta("description", "Isi kartu", 300)],
      },
    ],
  },
  {
    key: "journey",
    label: "Rundown show",
    description: "Tahapan pengalaman dalam satu show.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      t("durationLabel", "Label durasi", 40),
      {
        key: "steps",
        label: "Tahapan",
        type: "list",
        itemLabel: "Tahap",
        min: 1,
        max: 12,
        fields: [t("title", "Nama tahap", 80), ta("description", "Penjelasan", 300)],
      },
    ],
  },
  {
    key: "schedule",
    label: "Jadwal",
    description: "Judul section jadwal. Tanggal & jam show diatur di menu Sesi.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      t("cta", "Teks tombol", 40),
    ],
  },
  {
    key: "packages",
    label: "Paket F&B",
    description: "Judul section paket. Nama, harga, dan isi paket diatur di menu Paket F&B.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      t("featuredBadge", "Label paket unggulan", 40),
    ],
  },
  {
    key: "services",
    label: "Tentang Hololabs",
    description: "Lini layanan Hololabs.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      {
        key: "categories",
        label: "Kategori layanan",
        type: "list",
        itemLabel: "Kategori",
        min: 1,
        max: 12,
        fields: [
          t("title", "Nama kategori", 60),
          { key: "items", label: "Layanan", type: "tags", hint: "Satu layanan per baris." },
        ],
      },
    ],
  },
  {
    key: "howItWorks",
    label: "Cara pesan",
    description: "Langkah-langkah memesan tiket.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      {
        key: "steps",
        label: "Langkah",
        type: "list",
        itemLabel: "Langkah",
        min: 1,
        max: 6,
        fields: [t("title", "Judul langkah", 80), ta("description", "Penjelasan", 300)],
      },
    ],
  },
  {
    key: "cta",
    label: "Ajakan di bagian bawah",
    description: "Banner besar sebelum footer.",
    fields: [
      t("badge", "Label kecil"),
      t("title", "Judul"),
      ta("text", "Kalimat", 400),
      t("ctaPrimary", "Teks tombol utama", 40),
      t("ctaSecondary", "Teks tombol kedua", 40),
    ],
  },
  {
    key: "contact",
    label: "Kontak & footer",
    description: "Nomor WhatsApp admin (dipakai juga untuk tombol konfirmasi pembayaran), email, Instagram, dan teks footer.",
    fields: [
      t("whatsapp", "Nomor WhatsApp admin (format 08…)", 20),
      t("email", "Email", 80),
      t("instagram", "Instagram (tanpa @)", 60),
      ta("footerText", "Deskripsi di footer", 400),
      t("scheduleInfo", "Info jadwal di footer", 120),
    ],
  },
] as const satisfies readonly SectionDef[];

export type SectionKey = (typeof sections)[number]["key"];

export const defaults = {
  hero: {
    badge: `Pemesanan resmi ${siteConfig.shortName}` as string,
    title: "Amankan kursimu di",
    titleAccent: "Hololabs",
    titleSuffix: ".",
    lead: "Satu show, 1,5 jam pengalaman penuh — dari video mapping, pertunjukan interaktif, sampai ngobrol dengan AI avatar. Kalau show pilihanmu penuh, sistem otomatis mengarahkan ke show berikutnya yang masih tersedia.",
    ctaPrimary: "Pesan Tiket",
    ctaSecondary: "Lihat Jadwal & Paket",
    stats: [
      { value: "18.00–21.00", label: "WIB / hari" },
      { value: "2×1,5j", label: "Show / hari" },
      { value: "13", label: "Kursi / show" },
    ],
    previewNote: "Ilustrasi tampilan jadwal. Show 18.00 penuh — pemesan otomatis diarahkan ke show 19.30 tanpa kehilangan urutan.",
  },
  valueProps: {
    eyebrow: "Kenapa pesan online",
    title: "Booking engine, bukan sekadar formulir",
    description: "Dibangun untuk menghilangkan rebutan kursi di lokasi dan antrean pembayaran manual.",
    items: valueProps.map(({ title, description }) => ({ title, description })),
  },
  journey: {
    eyebrow: "Rundown show",
    title: "Satu show, tujuh tahap pengalaman",
    description: "Dari duduk sampai pulang, seluruh rangkaian berjalan dalam satu show berdurasi 1,5 jam.",
    durationLabel: journeyDurationLabel,
    steps: journeySteps.map(({ title, description }) => ({ title, description })),
  },
  schedule: {
    eyebrow: "Jadwal",
    title: "Lima hari, dua show per hari",
    description: "Satu show berdurasi 1,5 jam. Sisa kursi tiap show dihitung langsung dari sistem saat kamu membuka halaman pemesanan.",
    cta: "Cek kursi & pesan",
  },
  packages: {
    eyebrow: "Paket F&B",
    title: "Pilih paket sesuai rombonganmu",
    description: "Harga berlaku per kursi. Dipilih saat pemesanan, bersamaan dengan sesi dan jumlah kursi.",
    featuredBadge: "Paling dipilih",
  },
  services: {
    eyebrow: "Tentang Hololabs",
    title: "Teknologi di balik pengalamannya",
    description: "Hololabs menghadirkan teknologi imersif lintas lini — exhibition ini adalah salah satu cara merasakannya langsung.",
    categories: serviceCategories.map(({ title, items }) => ({ title, items: [...items] })),
  },
  howItWorks: {
    eyebrow: "Alurnya",
    title: "Empat langkah, tanpa antre",
    steps: howItWorks.map(({ title, description }) => ({ title, description })),
  },
  cta: {
    badge: "Kuota 13 kursi per sesi",
    title: "Sesi favorit cepat penuh — amankan kursimu sekarang.",
    text: "Pilih tanggal, pilih paket F&B, bayar dengan QRIS. E-tiket langsung aktif setelah pembayaran diverifikasi.",
    ctaPrimary: "Pesan Tiket Sekarang",
    ctaSecondary: "Cek Status Tiket",
  },
  contact: {
    whatsapp: String(siteConfig.whatsapp),
    email: String(siteConfig.email),
    instagram: "hololabs.exhibition",
    footerText: String(siteConfig.description),
    scheduleInfo: `${siteConfig.dailyWindowLabel} · ${siteConfig.sessionDurationLabel} · ${siteConfig.seatsPerSessionLabel}`,
  },
};

export type SiteContent = typeof defaults;

export function sectionDef(key: string): SectionDef | undefined {
  return (sections as readonly SectionDef[]).find((s) => s.key === key);
}
