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
    description:
      "Profil founder dan satu tokoh kunci lain — data sementara (lorem ipsum), silakan ganti dengan data asli. Di kolom bio: pisahkan paragraf dengan baris kosong, dan beri tanda **dua bintang** di sekitar kata yang ingin ditebalkan.",
    fields: [
      t("founderHeading", "Judul bagian founder", 60),
      t("founderSubtitle", "Subjudul founder", 120),
      t("founderName", "Nama founder", 60),
      t("founderTitle", "Jabatan founder", 80),
      ta("founderBio", "Bio founder", 2400),
      t("leadHeading", "Judul bagian profil kedua", 60),
      t("leadSubtitle", "Subjudul profil kedua", 120),
      t("leadName", "Nama", 60),
      t("leadTitle", "Jabatan", 80),
      ta("leadBio", "Bio", 2400),
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
    founderHeading: "Meet Our Founder",
    founderSubtitle: "The visionary behind Hololabs",
    founderName: "Nama Founder",
    founderTitle: "Founder & Creative Director",
    founderBio: [
      "Lorem ipsum dolor sit amet, **consectetur adipiscing elit**, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. **Excepteur sint occaecat** cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et **quasi architecto beatae vitae dicta sunt explicabo**.",
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
    ].join("\n\n"),
    leadHeading: "Meet Our Experience Lead",
    leadSubtitle: "Expert craftsmanship in every experience",
    leadName: "Nama Experience Lead",
    leadTitle: "Lead Technologist",
    leadBio: [
      "Lorem ipsum dolor sit amet, **consectetur adipiscing elit**, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. **Excepteur sint occaecat** cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. **Quis autem vel eum iure reprehenderit** qui in ea voluptate velit esse quam nihil molestiae consequatur.",
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    ].join("\n\n"),
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
