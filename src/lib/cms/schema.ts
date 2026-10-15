import { siteConfig } from "@/data/site";

/**
 * Editable website content (CMS) — Hololabs v4.
 *
 * The client asked for the homepage to mirror meatguysteakhouse.com's
 * structure and reading order exactly: Hero → About Us → Founder profile →
 * second profile ("meat master" equivalent) → Hours/Schedule →
 * standalone Reservation CTA → Contact → FAQ → Footer. Sections that don't
 * have an equivalent slot in that reference (the earlier Ambiance stat
 * strip, the Collection bento grid, the Rundown timeline, the Our Story
 * DNA pills) are gone from the homepage; what they said is folded into the
 * About Us prose instead. `fields` drives both the admin editor and
 * server-side validation; `defaults` is exactly what the site shows before
 * an admin edits anything.
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
    description: "Judul besar, kalimat pembuka, dan dua tombol.",
    fields: [
      t("badge", "Label kecil di atas judul"),
      t("title", "Judul (bagian putih)"),
      t("titleAccent", "Judul (bagian berwarna gradien)"),
      t("titleSuffix", "Judul (akhiran, mis. titik)", 20),
      ta("lead", "Kalimat pembuka"),
      t("ctaPrimary", "Teks tombol utama", 40),
      t("ctaSecondary", "Teks tombol kedua", 40),
    ],
  },
  {
    key: "about",
    label: "About Us",
    description: "Pengenalan singkat Hololabs — dua paragraf dan tiga angka ringkas.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("bodyShort", "Paragraf pertama", 400),
      ta("bodyLong", "Paragraf kedua", 500),
      {
        key: "badges",
        label: "Angka ringkas",
        type: "list",
        itemLabel: "Angka",
        min: 0,
        max: 4,
        fields: [t("value", "Angka / teks besar", 30), t("label", "Keterangan", 50)],
      },
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
    key: "schedule",
    label: "Jadwal Show",
    description: "Judul jadwal. Tanggal & jam show diatur di menu Sesi.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 300),
      t("cta", "Teks tombol", 40),
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
    lead: "Satu Experience Journey, 1,5 jam — dari video mapping Journey of Life, pertunjukan interaktif dengan DJ, ngobrol dengan AI avatar, sampai custom 3D printing.",
    ctaPrimary: "Reservasi Sekarang",
    ctaSecondary: "Lihat Jadwal Show",
  },
  about: {
    eyebrow: "About Us",
    title: "Tentang Hololabs",
    bodyShort:
      "Hololabs adalah creative technology lab yang mengubah teknologi — projection mapping, AI, VR, hingga 3D printing — menjadi satu pengalaman yang bisa dilihat, didengar, dan disentuh langsung.",
    bodyLong:
      "Satu Experience Journey berjalan 1,5 jam, melewati tujuh babak: booking seat, video mapping Journey of Life, pertunjukan interaktif dengan DJ, ngobrol dengan Doocoon AI, road to smart home technology, custom 3D printing, sampai pulang membawa karya sendiri. Kami percaya teknologi paling berkesan bukan yang hanya ditonton, tapi yang dialami.",
    badges: [
      { value: "1,5 jam", label: "Experience Journey" },
      { value: "8", label: "Lini teknologi" },
      { value: "1–50", label: "Orang / sesi" },
    ],
  },
  people: {
    eyebrow: "Our People",
    founderName: "Nama Founder",
    founderTitle: "Founder & Creative Director, Hololabs",
    founderBio:
      "Data sementara — bio founder asli menyusul. Founder Hololabs membangun lab ini dari ketertarikan pada titik temu teknologi dan pengalaman manusia: bagaimana projection, AI, dan desain ruang bisa berhenti jadi alat, dan mulai jadi cerita yang dialami langsung oleh pengunjung.",
    leadEyebrow: "Meet Our Experience Lead",
    leadName: "Nama Experience Lead",
    leadTitle: "Lead Technologist, Hololabs",
    leadBio:
      "Data sementara — bio asli menyusul. Memimpin tim teknis di balik tiap babak Experience Journey, dari kalibrasi projection mapping sampai memastikan Doocoon AI merespons setiap pengunjung dengan natural.",
  },
  schedule: {
    eyebrow: "Jadwal",
    title: "Pilih tanggal & show",
    description: "Satu show berdurasi 1,5 jam. Sisa kursi tiap show dihitung langsung dari sistem.",
    cta: "Lihat kursi",
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
