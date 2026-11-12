import { siteConfig } from "@/data/site";
import { ambianceStats } from "@/data/ambiance";
import { collectionItems } from "@/data/collection";
import { journeySteps, journeyDurationLabel } from "@/data/journey";
import { storyIntro, philosophy, dnaTraits, manifesto } from "@/data/story";
import { bestWorks } from "@/data/best-works";
import { faqItems } from "@/data/faq";
import { mainNav } from "@/data/site";

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

/**
 * `image` holds a URL path ("/media/<id>" for an upload, or one of the
 * images shipped in /public); `url` holds a link ("/path", "#anchor" or
 * "https://..."). Both are validated in sanitizeSection.
 */
export type TextField = { key: string; label: string; type: "text" | "textarea" | "image" | "url"; max?: number; hint?: string };
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
const img = (key: string, label: string, hint?: string): TextField => ({ key, label, type: "image", max: 200, hint });
const url = (key: string, label: string, hint?: string): TextField => ({ key, label, type: "url", max: 300, hint });

export const sections = [
  {
    key: "brand",
    label: "Logo & identitas situs",
    description: "Logo di header, footer, admin, dan halaman pemesanan, plus judul dan deskripsi yang muncul di Google.",
    fields: [
      img("logoLockup", "Logo lengkap (ikon + tulisan)", "Dipakai di header, footer, admin. PNG transparan, rasio mendatar."),
      img("logoMark", "Logo ikon saja", "Dipakai di e-tiket dan halaman 404. PNG transparan."),
      t("siteName", "Nama situs", 40),
      t("seoTitle", "Judul di Google & tab browser", 120),
      ta("seoDescription", "Deskripsi di Google", 300),
    ],
  },
  {
    key: "navigation",
    label: "Menu & tombol",
    description: "Teks tombol Reservasi, isi menu hamburger (juga dipakai di footer), dan gambar panel menu.",
    fields: [
      t("reservationLabel", "Teks tombol Reservasi", 30),
      {
        key: "menuItems",
        label: "Isi menu",
        type: "list",
        itemLabel: "Menu",
        min: 1,
        max: 10,
        fields: [t("label", "Nama menu", 30), url("href", "Tujuan link", "Mis. /ambiance atau /#faq")],
      },
      img("menuImage", "Gambar panel menu (kiri)"),
      t("menuEyebrow", "Label kecil di panel menu", 40),
      t("menuTagline", "Kalimat di panel menu", 80),
    ],
  },
  {
    key: "hero",
    label: "Hero (bagian paling atas)",
    description: "Judul besar dan kalimat pembuka.",
    fields: [
      img("backgroundImage", "Gambar latar hero"),
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
    key: "bestWorks",
    label: "Our Best Works",
    description: "Daftar proyek klien dan logo yang berjalan sebagai marquee di bawah About Us.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      {
        key: "items",
        label: "Proyek",
        type: "list",
        itemLabel: "Proyek",
        min: 0,
        max: 24,
        fields: [t("title", "Nama proyek", 100), t("client", "Nama klien", 60), img("logo", "Logo klien", "Kosongkan kalau tidak ada logo.")],
      },
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
      img("founderPhoto", "Foto founder", "Foto persegi paling pas. Bawaan: logo Hololabs."),
      ta("founderBio", "Bio founder", 2400),
      t("leadHeading", "Judul bagian profil kedua", 60),
      t("leadSubtitle", "Subjudul profil kedua", 120),
      t("leadName", "Nama", 60),
      t("leadTitle", "Jabatan", 80),
      img("leadPhoto", "Foto profil kedua", "Foto persegi paling pas. Bawaan: logo Hololabs."),
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
      img("image", "Gambar suasana"),
      t("imageAlt", "Deskripsi gambar (untuk pembaca layar)", 200),
      t("imageCaption", "Keterangan di atas gambar", 120),
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
      img("image", "Gambar Our Story", "Ditampilkan di atas latar putih."),
      t("imageAlt", "Deskripsi gambar (untuk pembaca layar)", 200),
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
    key: "location",
    label: "Lokasi",
    description: "Judul, gambar peta, dan link Google Maps di bagian Lokasi halaman depan.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      ta("description", "Deskripsi section", 240),
      img("mapImage", "Gambar peta"),
      url("mapLink", "Link Google Maps", "Tempel link dari Google Maps (https://…)."),
      t("mapBadge", "Label di atas gambar peta", 30),
      t("cardTitle", "Judul kartu peta", 60),
      t("cardSubtitle", "Keterangan kartu peta", 100),
      t("cardCta", "Teks tombol di kartu peta", 40),
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Pertanyaan yang sering diajukan. Jawaban pertama tampil terbuka.",
    fields: [
      t("eyebrow", "Label section"),
      t("title", "Judul section"),
      {
        key: "items",
        label: "Pertanyaan",
        type: "list",
        itemLabel: "Pertanyaan",
        min: 0,
        max: 20,
        fields: [t("question", "Pertanyaan", 160), ta("answer", "Jawaban", 600)],
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
      t("footerNavTitle", "Judul kolom menu di footer", 40),
      t("footerScheduleTitle", "Judul kolom info sesi di footer", 40),
      t("footerWhatsappNote", "Kalimat sebelum nomor WhatsApp di footer", 120),
      t("footerCopyright", "Nama di baris hak cipta", 60),
    ],
  },
] as const satisfies readonly SectionDef[];

export type SectionKey = (typeof sections)[number]["key"];

export const defaults = {
  brand: {
    logoLockup: "/hololabs-lockup.png",
    logoMark: "/hololabs-mark.png",
    siteName: siteConfig.name,
    seoTitle: `${siteConfig.name} — ${siteConfig.tagline}`,
    seoDescription: String(siteConfig.description),
  },
  navigation: {
    reservationLabel: "Reservasi",
    menuItems: mainNav.map(({ label, href }) => ({ label, href })),
    menuImage: "/renders/ambiance-hall.jpg",
    menuEyebrow: siteConfig.name,
    menuTagline: "A Creative Technology Lab",
  },
  hero: {
    backgroundImage: "/renders/ambiance-hall.jpg",
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
  bestWorks: {
    eyebrow: "Our Best Works",
    title: "Proyek yang sudah kami kerjakan",
    items: bestWorks.map(({ title, client, logo }) => ({ title, client, logo })),
  },
  people: {
    founderPhoto: "/hololabs-mark.png",
    leadPhoto: "/hololabs-mark.png",
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
    image: "/renders/ambiance-hall.jpg",
    imageAlt: "Render suasana ruang Hololabs — koridor imersif dengan dinding LED",
    imageCaption: "Ilustrasi render — belum foto venue asli.",
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
    image: "/renders/story-glass-logo.jpg",
    imageAlt: "Logo Hololabs dalam bentuk kaca 3D, simbol pertemuan dunia fisik dan digital",
    eyebrow: storyIntro.eyebrow,
    statement: storyIntro.statement,
    lead: storyIntro.lead,
    philosophyQuote: philosophy.quote,
    philosophyBody: philosophy.body,
    traits: dnaTraits.map(({ title, description }) => ({ title, description })),
    manifesto: [...manifesto],
  },
  location: {
    eyebrow: "Lokasi",
    title: "Temukan Hololabs",
    description: "Klik peta di bawah untuk rute lengkap ke lokasi. Tanggal dan sesi dipilih saat reservasi.",
    mapImage: "/renders/map.jpg",
    mapLink: "https://maps.app.goo.gl/UJTHbjNEDMiDtwdx7",
    mapBadge: "Open in Maps",
    cardTitle: "Lokasi Hololabs",
    cardSubtitle: "Klik untuk buka rute di Google Maps.",
    cardCta: "Buka di Google Maps",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Pertanyaan yang sering ditanyakan",
    items: faqItems.map(({ question, answer }) => ({ question, answer })),
  },
  contact: {
    footerNavTitle: "Jelajahi",
    footerScheduleTitle: "Informasi Sesi",
    footerWhatsappNote: "Konfirmasi pembayaran & pertanyaan lain lewat WhatsApp:",
    footerCopyright: siteConfig.name,
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
