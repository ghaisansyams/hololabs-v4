import { siteConfig } from "@/data/site";
import { ambianceStats } from "@/data/ambiance";
import { collectionItems } from "@/data/collection";
import { journeySteps, journeyDurationLabel } from "@/data/journey";
import { storyIntro, philosophy, dnaTraits, manifesto } from "@/data/story";

/**
 * Editable website content (CMS) — Hololabs v4.
 *
 * The client asked for the homepage to mirror meatguysteakhouse.com's
 * structure and reading order exactly: Hero → About Us → Founder profile →
 * second profile ("meat master" equivalent) → Hours/Schedule →
 * standalone Reservation CTA → Contact → FAQ → Footer. Sections that don't
 * have an equivalent slot in that reference (Ambiance, Collection, Rundown,
 * Our Story) aren't on the homepage; each lives on its own page instead,
 * reached from the header's menu (hamburger) — mirroring how Meat Guy's
 * own menu opens separate pages for Our Story, Menus, Events, etc. `fields`
 * drives both the admin editor and server-side validation; `defaults` is
 * exactly what the site shows before an admin edits anything.
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
    description: "Judul besar dan kalimat pembuka.",
    fields: [
      t("badge", "Label kecil di atas judul"),
      t("title", "Judul (bagian putih)"),
      t("titleAccent", "Judul (bagian berwarna gradien)"),
      t("titleSuffix", "Judul (akhiran, mis. titik)", 20),
      ta("lead", "Kalimat pembuka"),
    ],
  },
  {
    key: "about",
    label: "About Us",
    description: "Pengenalan singkat Hololabs — dua paragraf.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("bodyShort", "Paragraf pertama", 400),
      ta("bodyLong", "Paragraf kedua", 500),
    ],
  },
  {
    key: "people",
    label: "Founder & Tim",
    description: "Profil founder dan satu tokoh kunci lain — data sementara (dummy), silakan ganti dengan data asli.",
    fields: [
      t("eyebrow", "Label section"),
      t("founderName", "Nama founder", 60),
      t("founderTitle", "Jabatan founder", 80),
      ta("founderBio", "Bio founder", 600),
      t("leadEyebrow", "Label profil kedua", 60),
      t("leadName", "Nama", 60),
      t("leadTitle", "Jabatan", 80),
      ta("leadBio", "Bio", 600),
    ],
  },
  {
    key: "ambiance",
    label: "Ambiance (halaman terpisah)",
    description: "Pengenalan tempat & suasana saja — bukan konten imersif (itu ada di Collection). Dibuka dari menu header.",
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
    label: "Collection (halaman terpisah)",
    description: "Karya 3D & konten imersif Hololabs — audio, reaction stage, avatar zone, dan sejenisnya. Dibuka dari menu header.",
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
    label: "Rundown (halaman terpisah)",
    description: "Alur cerita & tahapan show (bukan \"Menu\") — durasi tiap tahap bisa diubah. Dibuka dari menu header.",
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
    key: "ourStory",
    label: "Our Story (halaman terpisah)",
    description: "Cerita brand Hololabs — draft berjalan, belum final dari tim konten. Dibuka dari menu header.",
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
    badge: `${siteConfig.shortName} · A Creative Technology Lab`,
    title: "Don't just see the technology.",
    titleAccent: "Step inside it.",
    titleSuffix: "",
    lead: "Satu Experience Journey, 1,5 jam: dari video mapping Journey of Life, pertunjukan interaktif dengan DJ, ngobrol dengan AI avatar, sampai custom 3D printing.",
  },
  about: {
    eyebrow: "About Us",
    title: "Tentang Hololabs",
    bodyShort:
      "Hololabs adalah creative technology lab yang mengubah teknologi, mulai dari projection mapping, AI, VR, hingga 3D printing, menjadi satu pengalaman yang bisa dilihat, didengar, dan disentuh langsung.",
    bodyLong:
      "Satu Experience Journey berjalan 1,5 jam, melewati tujuh babak: booking seat, video mapping Journey of Life, pertunjukan interaktif dengan DJ, ngobrol dengan Doocoon AI, road to smart home technology, custom 3D printing, sampai pulang membawa karya sendiri. Kami percaya teknologi paling berkesan bukan yang hanya ditonton, tapi yang dialami.",
  },
  people: {
    eyebrow: "Our People",
    founderName: "Nama Founder",
    founderTitle: "Founder & Creative Director, Hololabs",
    founderBio:
      "Data sementara, bio founder asli menyusul. Founder Hololabs membangun lab ini dari ketertarikan pada titik temu teknologi dan pengalaman manusia: bagaimana projection, AI, dan desain ruang bisa berhenti jadi alat, dan mulai jadi cerita yang dialami langsung oleh pengunjung.",
    leadEyebrow: "Meet Our Experience Lead",
    leadName: "Nama Experience Lead",
    leadTitle: "Lead Technologist, Hololabs",
    leadBio:
      "Data sementara, bio asli menyusul. Memimpin tim teknis di balik tiap babak Experience Journey, dari kalibrasi projection mapping sampai memastikan Doocoon AI merespons setiap pengunjung dengan natural.",
  },
  ambiance: {
    eyebrow: "Ambiance",
    title: "Satu ruang, banyak dimensi pengalaman.",
    description:
      "Hololabs dirancang sebagai ruang yang transparan, berlapis, dan saling terhubung, tempat dunia fisik dan digital bertemu. Sebelum masuk ke isinya, rasakan dulu suasananya: cahaya, pantulan, dan ruang yang terus berubah bentuk mengikuti cerita.",
    stats: ambianceStats.map(({ value, label }) => ({ value, label })),
  },
  collection: {
    eyebrow: "Collection",
    title: "Hasil karya & konten imersif kami",
    description: "Storytelling lewat teknologi: delapan lini bisnis jasa Hololabs, masing-masing bisa berdiri sendiri, atau terhubung jadi satu pengalaman utuh.",
    items: collectionItems.map(({ title, tagline, description, highlights }) => ({
      title,
      tagline,
      description,
      highlights: [...highlights],
    })),
  },
  rundown: {
    eyebrow: "Rundown",
    title: "Satu show,",
    titleAccent: "tujuh babak cerita.",
    description: "Bukan menu, ini alur cerita di dalam show, dari booking seat sampai pulang.",
    durationLabel: journeyDurationLabel,
    tagline: "1,5 jam exploring what technology can become.",
    steps: journeySteps.map((step) => ({ ...step })),
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
