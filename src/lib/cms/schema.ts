import { siteConfig } from "@/data/site";
import { ambianceFacts, ambiancePhases, ambianceStats } from "@/data/ambiance";
import { collectionItems } from "@/data/collection";
import { journeySteps, journeyDurationLabel } from "@/data/journey";
import { experienceSteps, visitStats } from "@/data/experience";
import { storyIntro, philosophy, dnaTraits, manifesto } from "@/data/story";
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
    description: "Judul besar, kalimat pembuka, dan dua tombol di layar pertama (di samping logo 3D).",
    fields: [
      t("badge", "Label kecil di atas judul"),
      t("title", "Judul (bagian putih)"),
      t("titleAccent", "Judul (bagian berwarna gradien)"),
      ta("lead", "Kalimat pembuka"),
      t("ctaPrimary", "Teks tombol utama (menuju reservasi)", 40),
      t("ctaSecondary", "Teks tombol kedua (menuju journey)", 40),
      { key: "words", label: "Kata-kata di bawah tombol", type: "tags", hint: "Satu kata per baris." },
    ],
  },
  {
    key: "experience",
    label: "Journey 3D (7 babak)",
    description:
      "Tujuh babak yang dilewati kamera 3D saat halaman di-scroll. Urutan gambar tiap babak tetap; teks, durasi, dan kata suasana bisa diubah.",
    fields: [
      {
        key: "steps",
        label: "Babak",
        type: "list",
        itemLabel: "Babak",
        min: 3,
        max: 7,
        fields: [
          t("mood", "Kata suasana (mis. Amazed)", 30),
          t("title", "Judul babak", 60),
          ta("description", "Penjelasan", 240),
          t("minutes", "Durasi (mis. 15 menit)", 20),
        ],
      },
    ],
  },
  {
    key: "visit",
    label: "Reservasi & info kunjungan",
    description: "Angka ringkas, jadwal & lokasi, contoh e-tiket, dan pilihan individu atau grup.",
    fields: [
      {
        key: "stats",
        label: "Angka ringkas",
        type: "list",
        itemLabel: "Angka",
        min: 0,
        max: 4,
        fields: [t("value", "Angka / teks besar", 20), t("label", "Keterangan", 40)],
      },
      t("eyebrow", "Label bagian reservasi"),
      t("title", "Judul bagian reservasi", 80),
      ta("body", "Kalimat di bawah judul", 240),
      t("cta", "Teks tombol reservasi", 40),
      t("ticketNote", "Keterangan di bawah contoh tiket", 60),
      {
        key: "facts",
        label: "Jadwal & lokasi",
        type: "list",
        itemLabel: "Info",
        min: 0,
        max: 4,
        fields: [t("label", "Judul", 30), t("value", "Isi utama", 80), t("note", "Keterangan kecil", 100)],
      },
      t("personalTitle", "Judul kolom individu", 60),
      ta("personalBody", "Penjelasan kolom individu", 240),
      { key: "personalTags", label: "Label kolom individu", type: "tags", hint: "Satu label per baris." },
      t("personalCta", "Tombol kolom individu", 40),
      t("groupTitle", "Judul kolom grup", 60),
      ta("groupBody", "Penjelasan kolom grup", 240),
      { key: "groupTags", label: "Label kolom grup", type: "tags", hint: "Satu label per baris." },
      t("groupCta", "Tombol kolom grup (WhatsApp)", 40),
      ta("groupMessage", "Pesan WhatsApp otomatis untuk private show", 300),
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
      {
        key: "stats",
        label: "Angka suasana",
        type: "list",
        itemLabel: "Angka",
        min: 0,
        max: 4,
        fields: [t("value", "Angka / teks besar", 30), t("label", "Keterangan", 50)],
      },
      t("phasesEyebrow", "Label bagian perjalanan"),
      t("phasesTitle", "Judul bagian perjalanan", 120),
      {
        key: "phases",
        label: "Tahapan perjalanan",
        type: "list",
        itemLabel: "Tahap",
        min: 2,
        max: 4,
        fields: [
          t("title", "Nama tahap", 50),
          t("time", "Waktu (mis. Menit 0–10)", 30),
          ta("description", "Penjelasan", 300),
          { key: "tags", label: "Sorotan", type: "tags", hint: "Satu sorotan per baris, maksimal 3." },
        ],
      },
      t("factsTitle", "Judul bagian informasi praktis", 80),
      {
        key: "facts",
        label: "Informasi praktis",
        type: "list",
        itemLabel: "Informasi",
        min: 0,
        max: 8,
        fields: [t("label", "Judul", 30), t("value", "Isi", 200)],
      },
      t("closingTitle", "Kalimat penutup", 80),
      t("collectionLabel", "Teks link ke Collection", 40),
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
    description: "Kartu peta di pojok kanan bawah footer: gambar peta, link Google Maps, dan teksnya.",
    fields: [
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
    description:
      "Nomor WhatsApp admin (dipakai juga untuk tombol konfirmasi pembayaran), email, alamat, media sosial, dan teks footer. LinkedIn masih data contoh, silakan ganti dengan data asli.",
    fields: [
      t("whatsapp", "Nomor WhatsApp admin (format 08…)", 20),
      t("email", "Email", 80),
      t("instagram", "Instagram (tanpa @)", 60),
      t("linkedin", "LinkedIn (nama halaman perusahaan, tanpa link)", 60),
      ta("address", "Alamat di footer (satu baris per alamat)", 200),
      ta("footerText", "Deskripsi di footer", 400),
      t("scheduleInfo", "Info jadwal di footer", 120),
      t("footerNavTitle", "Judul kolom menu di footer", 40),
      t("footerContactTitle", "Judul kolom kontak di footer", 40),
      t("footerFollowTitle", "Judul kolom media sosial di footer", 40),
      t("footerScheduleTitle", "Judul info sesi di footer", 40),
      t("footerWhatsappNote", "Kalimat sebelum nomor WhatsApp di footer", 120),
      t("footerTagline", "Tulisan kecil di kanan bawah footer", 80),
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
    menuImage: "/experience/journey-of-life.jpg",
    menuEyebrow: siteConfig.name,
    menuTagline: "A Creative Technology Lab",
  },
  hero: {
    badge: "Immersive · Interactive · Intelligent",
    title: "Jangan cuma melihat teknologi.",
    titleAccent: "Masuk ke dalamnya.",
    lead: "Satu show, 90 menit, 7 babak. Dari video mapping imersif sampai pulang membawa karya 3D print buatanmu sendiri.",
    ctaPrimary: "Pilih Jadwal Show",
    ctaSecondary: "Lihat Journey",
    words: ["See", "Touch", "Play", "Talk", "Enter", "Create"],
  },
  experience: {
    steps: experienceSteps.map(({ mood, title, description, minutes }) => ({ mood, title, description, minutes })),
  },
  visit: {
    stats: visitStats.map(({ value, label }) => ({ value, label })),
    eyebrow: "Reservasi",
    title: "Kursinya sedikit. Amankan sekarang.",
    body: "Pilih tanggal dan show, bayar online, dan e-ticket QR langsung dikirim ke email kamu.",
    cta: "Booking Sekarang",
    ticketNote: "Contoh tiket",
    facts: [
      { label: "Jadwal show", value: "18.00 & 19.30 WIB", note: "setiap hari, ± 90 menit per show" },
      { label: "Lokasi", value: "Duren Sawit, Jakarta Timur", note: "" },
    ],
    personalTitle: "Individu, teman & keluarga",
    personalBody: "Pilih tanggal dan show, bayar online, kursi langsung tercatat. Maksimal 6 orang per booking.",
    personalTags: ["Individu", "Friends & Family", "Komunitas"],
    personalCta: "Pilih Jadwal Show",
    groupTitle: "Sekolah, korporat & brand",
    groupBody: "Private show, field trip, team building, atau aktivasi brand. Hubungi kami untuk jadwal dan penawaran.",
    groupTags: ["School & University", "Corporate & Team", "Brand & Client", "Private Group"],
    groupCta: "Ajukan private show via WhatsApp",
    groupMessage:
      "Halo Hololabs, saya ingin mengajukan private show / kunjungan rombongan.\nNama instansi:\nPerkiraan jumlah orang:\nTanggal yang diinginkan:",
  },
  about: {
    eyebrow: "Apa itu Hololabs",
    title: "Where technology becomes experience.",
    bodyShort:
      "Hololabs adalah creative technology lab dari Holomoc. Projection mapping, AI, smart home, dan 3D printing dirangkai jadi satu perjalanan yang bisa kamu lihat, dengar, sentuh, dan ajak bicara.",
    bodyLong: "",
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
    eyebrow: "Ambiance",
    title: "Satu ruang, banyak dimensi pengalaman.",
    description:
      "Hololabs dirancang sebagai ruang yang transparan, berlapis, dan saling terhubung, tempat dunia fisik dan digital bertemu. Sebelum masuk ke isinya, rasakan dulu suasananya: cahaya, pantulan, dan ruang yang terus berubah bentuk mengikuti cerita.",
    stats: ambianceStats.map(({ value, label }) => ({ value, label })),
    phasesEyebrow: "Perjalanan",
    phasesTitle: "Sembilan puluh menit, empat tahap.",
    phases: ambiancePhases.map(({ title, time, description, tags }) => ({ title, time, description, tags: [...tags] })),
    factsTitle: "Sebelum Anda datang",
    facts: ambianceFacts.map(({ label, value }) => ({ label, value })),
    closingTitle: "Siap masuk ke dalamnya?",
    collectionLabel: "Lihat Collection",
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
    mapImage: "/renders/map.jpg",
    mapLink: "https://maps.google.com/?q=Jl.+Duren+Sawit+Indah+Blok+K1+No+10+Klender+Jakarta+Timur",
    mapBadge: "Open in Maps",
    cardTitle: "Lokasi Hololabs",
    cardSubtitle: "Klik untuk buka rute di Google Maps.",
    cardCta: "Buka di Google Maps",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Pertanyaan umum",
    items: faqItems.map(({ question, answer }) => ({ question, answer })),
  },
  contact: {
    footerNavTitle: "Menu",
    footerContactTitle: "Kontak",
    footerFollowTitle: "Ikuti Kami",
    footerScheduleTitle: "Informasi Sesi",
    footerTagline: "A Creative Technology Lab",
    linkedin: "holomoc",
    address: "Jl. Duren Sawit Indah, Blok K1 No 10, RT.5/RW.3, Klender\nKec. Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13440",
    footerWhatsappNote: "Konfirmasi pembayaran & pertanyaan lain lewat WhatsApp:",
    footerCopyright: "Holomoc",
    whatsapp: String(siteConfig.whatsapp),
    email: String(siteConfig.email),
    instagram: "hololabs.id",
    footerText: String(siteConfig.description),
    scheduleInfo: `${siteConfig.dailyWindowLabel} · ${siteConfig.sessionDurationLabel} · ${siteConfig.seatsPerSessionLabel}`,
  },
};

export type SiteContent = typeof defaults;

export function sectionDef(key: string): SectionDef | undefined {
  return (sections as readonly SectionDef[]).find((s) => s.key === key);
}
