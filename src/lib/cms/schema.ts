import { siteConfig } from "@/data/site";
import { ambianceStats } from "@/data/ambiance";
import { collectionItems } from "@/data/collection";
import { journeySteps, journeyDurationLabel } from "@/data/journey";
import { storyIntro, philosophy, dnaTraits, manifesto } from "@/data/story";

/**
 * Editable website content (CMS) — Hololabs v2.
 *
 * v2's homepage follows the storytelling, single-page structure from the
 * Oct 2026 revision notes (ref: meatguysteakhouse.com): Hero → Ambiance →
 * Collection → Rundown → Our Story → Reservasi. Section keys below mirror
 * that order. `fields` drives both the admin editor and server-side
 * validation; `defaults` is exactly what the site shows before an admin
 * edits anything.
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
    key: "ambiance",
    label: "01 · Ambiance",
    description: "Pengenalan tempat & suasana saja — bukan konten imersif (itu ada di Collection).",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi suasana/tempat", 400),
      {
        key: "stats",
        label: "Angka suasana",
        type: "list",
        itemLabel: "Angka",
        min: 0,
        max: 4,
        fields: [t("value", "Angka / teks besar", 30), t("label", "Keterangan", 50)],
      },
    ],
  },
  {
    key: "collection",
    label: "02 · Collection",
    description: "Karya 3D & konten imersif Hololabs — audio, reaction stage, avatar zone, dan sejenisnya.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      {
        key: "items",
        label: "Karya",
        type: "list",
        itemLabel: "Karya",
        min: 1,
        max: 12,
        fields: [
          t("title", "Nama karya", 60),
          t("tagline", "Tagline singkat", 80),
          ta("description", "Penjelasan", 280),
          { key: "highlights", label: "Sorotan", type: "tags", hint: "Satu sorotan per baris." },
        ],
      },
    ],
  },
  {
    key: "rundown",
    label: "03 · Rundown",
    description: "Alur cerita & tahapan show (bukan \"Menu\") — durasi tiap tahap bisa diubah.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      t("titleAccent", "Judul (bagian berwarna)", 80),
      ta("description", "Deskripsi section", 300),
      t("durationLabel", "Label durasi total", 40),
      t("tagline", "Kalimat setelah total menit", 100),
      {
        key: "steps",
        label: "Tahapan",
        type: "list",
        itemLabel: "Tahap",
        min: 1,
        max: 12,
        fields: [
          t("title", "Nama tahap", 80),
          t("subtitle", "Subjudul", 100),
          t("minutes", "Durasi (menit)", 4),
          ta("description", "Penjelasan", 300),
        ],
      },
    ],
  },
  {
    key: "schedule",
    label: "Jadwal show",
    description: "Judul jadwal di dalam section Rundown. Tanggal & jam show diatur di menu Sesi.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      t("cta", "Teks tombol", 40),
    ],
  },
  {
    key: "ourStory",
    label: "04 · Our Story",
    description: "Cerita brand Hololabs — draft berjalan, belum final dari tim konten.",
    fields: [
      t("eyebrow", "Label section"),
      ta("statement", "Pernyataan utama", 160),
      ta("lead", "Paragraf pembuka", 500),
      ta("philosophyQuote", "Kutipan filosofi", 160),
      ta("philosophyBody", "Paragraf filosofi", 500),
      {
        key: "traits",
        label: "Karakter brand (DNA)",
        type: "list",
        itemLabel: "Karakter",
        min: 1,
        max: 8,
        fields: [t("title", "Nama karakter", 40), ta("description", "Penjelasan", 160)],
      },
      { key: "manifesto", label: "Baris manifesto penutup", type: "tags", hint: "Satu baris per kalimat." },
    ],
  },
  {
    key: "reservation",
    label: "05 · Reservasi",
    description: "Judul & langkah singkat sebelum form pemesanan.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      {
        key: "steps",
        label: "Langkah alur reservasi",
        type: "list",
        itemLabel: "Langkah",
        min: 1,
        max: 6,
        fields: [t("title", "Judul langkah", 60), ta("description", "Penjelasan", 200)],
      },
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
    title: "Don't just see the technology.",
    titleAccent: "Step inside it.",
    titleSuffix: "",
    lead: "Satu Experience Journey, 1,5 jam — dari video mapping Journey of Life, pertunjukan interaktif dengan DJ, ngobrol dengan AI avatar, sampai custom 3D printing.",
    ctaPrimary: "Reservasi Sekarang",
    ctaSecondary: "Jelajahi Collection",
    stats: [
      { value: "1,5 jam", label: "Experience Journey" },
      { value: "8", label: "Zona imersif" },
      { value: "13", label: "Kursi / show" },
    ],
    previewNote: "Ilustrasi tampilan jadwal. Show penuh otomatis diarahkan ke show berikutnya tanpa kehilangan urutan.",
  },
  ambiance: {
    eyebrow: "01 · Ambiance",
    title: "Satu ruang, banyak dimensi pengalaman.",
    description:
      "Hololabs dirancang sebagai ruang yang transparan, berlapis, dan saling terhubung — tempat dunia fisik dan digital bertemu. Sebelum masuk ke isinya, rasakan dulu suasananya: cahaya, pantulan, dan ruang yang terus berubah bentuk mengikuti cerita.",
      stats: ambianceStats.map(({ value, label }) => ({ value, label })),
  },
  collection: {
    eyebrow: "02 · Collection",
    title: "Hasil karya & konten imersif kami",
    description: "Storytelling lewat teknologi: delapan lini bisnis jasa Hololabs — masing-masing bisa berdiri sendiri, atau terhubung jadi satu pengalaman utuh.",
    items: collectionItems.map(({ title, tagline, description, highlights }) => ({
      title,
      tagline,
      description,
      highlights: [...highlights],
    })),
  },
  rundown: {
    eyebrow: "03 · Rundown",
    title: "Satu show,",
    titleAccent: "tujuh babak cerita.",
    description: "Bukan menu — ini alur cerita dan jadwal acara di dalam show, dari booking seat sampai pulang.",
    durationLabel: journeyDurationLabel,
    tagline: "1,5 jam exploring what technology can become.",
    steps: journeySteps.map((step) => ({ ...step })),
  },
  schedule: {
    eyebrow: "Jadwal",
    title: "Pilih tanggal & show",
    description: "Satu show berdurasi 1,5 jam. Sisa kursi tiap show dihitung langsung dari sistem.",
    cta: "Lihat kursi",
  },
  ourStory: {
    eyebrow: storyIntro.eyebrow,
    statement: storyIntro.statement,
    lead: storyIntro.lead,
    philosophyQuote: philosophy.quote,
    philosophyBody: philosophy.body,
    traits: dnaTraits.map(({ title, description }) => ({ title, description })),
    manifesto: [...manifesto],
  },
  reservation: {
    eyebrow: "Reservasi",
    title: "Simpel: pilih tanggal, isi data, bayar.",
    description: "Tanpa langkah berlebihan — reservasi selesai dalam beberapa menit.",
    steps: [
      { title: "Pilih tanggal", description: "Lihat jadwal show dan sisa kursi secara langsung." },
      { title: "Pilih sesi", description: "Kalau sesi penuh, sistem otomatis arahkan ke sesi berikutnya." },
      { title: "Isi data", description: "Nama, WhatsApp, dan jumlah kursi untuk rombonganmu." },
      { title: "Pembayaran", description: "Transfer bank, konfirmasi langsung di halaman ini." },
    ],
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
