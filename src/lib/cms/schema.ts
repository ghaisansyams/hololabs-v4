import { siteConfig } from "@/data/site";
import { experienceSteps, visitStats } from "@/data/experience";
import { showroomDefaults, showroomZones } from "@/data/showroom";
import { faqItems } from "@/data/faq";
import { mainNav } from "@/data/site";

/**
 * Editable website content (CMS) — Hololabs v4.
 *
 * The public site is one page (3D journey, About, Reservasi, FAQ) plus the
 * booking flow, following hololabs.id. `fields` drives both the admin editor
 * and server-side validation; `defaults` is exactly what the site shows
 * before an admin edits anything.
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
  /** Sub-field whose value is shown next to "Zona 3" etc., so admins see which item is which. */
  itemTitle?: string;
  hint?: string;
  fields: (TextField | TagsField)[];
  min?: number;
  max?: number;
};
/** A sub-heading inside the editor that names the part of the page the fields below belong to. Holds no value. */
export type HeadingField = { key: string; label: string; type: "heading"; hint?: string };
export type FieldDef = TextField | TagsField | ListField | HeadingField;

export interface SectionDef {
  key: string;
  label: string;
  description: string;
  /** "home": the homepage, listed top to bottom as it appears; "other": booking, email, 404. */
  page: "home" | "other";
  fields: FieldDef[];
}

const t = (key: string, label: string, max = 160, hint?: string): TextField => ({ key, label, type: "text", max, hint });
const ta = (key: string, label: string, max = 600, hint?: string): TextField => ({ key, label, type: "textarea", max, hint });
const img = (key: string, label: string, hint?: string): TextField => ({ key, label, type: "image", max: 200, hint });
const url = (key: string, label: string, hint?: string): TextField => ({ key, label, type: "url", max: 300, hint });
const h = (key: string, label: string, hint?: string): HeadingField => ({ key, label, type: "heading", hint });

/**
 * Sections in the order they appear on the website, top to bottom; fields
 * inside each section follow the same order. Homepage sections come first,
 * then the booking pages, the emails and the 404 page.
 */
export const sections = [
  {
    key: "brand",
    page: "home",
    label: "Logo & identitas situs",
    description: "Logo di kiri atas header (juga di footer, admin, dan halaman pemesanan), nama situs, serta judul dan deskripsi yang muncul di Google.",
    fields: [
      img("logoLockup", "Logo lengkap (ikon + tulisan)", "Dipakai di header, footer, admin. PNG transparan, rasio mendatar."),
      img("logoMark", "Logo ikon saja", "Dipakai di e-tiket dan halaman 404. PNG transparan."),
      t("siteName", "Nama situs", 40, "Juga tampil di footer di bawah logo."),
      h("seo", "Hasil pencarian Google"),
      t("seoTitle", "Judul di Google & tab browser", 120),
      ta("seoDescription", "Deskripsi di Google", 300),
    ],
  },
  {
    key: "navigation",
    page: "home",
    label: "Menu & tombol Reservasi (header)",
    description: "Tautan menu di header dan tombol Reservasi di kanan atas (di HP, tombol di tengah dan menu di balik ikon garis tiga).",
    fields: [
      {
        key: "menuItems",
        label: "Isi menu (urut dari kiri)",
        type: "list",
        itemLabel: "Menu",
        itemTitle: "label",
        min: 1,
        max: 10,
        fields: [t("label", "Nama menu", 30), url("href", "Tujuan link", "Mis. /#faq atau /booking")],
      },
      t("reservationLabel", "Teks tombol Reservasi", 30),
    ],
  },
  {
    key: "hero",
    page: "home",
    label: "Hero (layar pertama)",
    description: "Label kecil, judul besar, kalimat pembuka, dan dua tombol di layar pertama.",
    fields: [
      t("badge", "Label kecil di atas judul"),
      t("title", "Judul (bagian putih)"),
      t("titleAccent", "Judul (bagian berwarna gradien)"),
      ta("lead", "Kalimat pembuka"),
      t("ctaPrimary", "Teks tombol utama (menuju halaman booking)", 40),
      t("ctaSecondary", "Teks tombol kedua (menuju Perjalanan)", 40),
    ],
  },
  {
    key: "showroom",
    page: "home",
    label: "Denah showroom",
    description: "Judul dan pengantar, foto besar zona terpilih, tombol lantai, denah, dan keterangan di bawah denah. Setiap zona punya nama, tulisan di denah, dan sampai 4 foto.",
    fields: [
      t("eyebrow", "Label kecil di atas judul", 40),
      t("title", "Judul", 80),
      ta("body", "Kalimat pengantar", 360),
      h("photoPart", "Foto zona (di atas denah)"),
      t("noPhoto", "Teks saat zona belum punya foto", 80),
      h("planPart", "Denah"),
      img("planImage", "Gambar denah", "Gambar denah tampak atas (bawaan 1784 × 621 px). Tombol zona dan bagian kantor yang diburamkan diletakkan mengikuti tata letak gambar bawaan, jadi gambar pengganti sebaiknya bertata letak dan berukuran sama."),
      t("floorGround", "Tombol lantai 1", 24),
      t("floorUpper", "Tombol mezzanine", 24),
      t("swipeHint", "Petunjuk geser denah (hanya di HP)", 100),
      {
        key: "zones",
        label: "Zona",
        type: "list",
        itemLabel: "Zona",
        itemTitle: "name",
        hint: "Urutan tetap sesuai nomor di denah: 1 Area parkir, 2 Aula Utama, 3 Panggung DJ, 4 Area Santai, 5 Area Rapat, 6 Ruang Kendali, 7 Kursi Penonton (mezzanine).",
        min: 7,
        max: 7,
        fields: [
          t("name", "Nama zona (judul di bawah foto)", 40),
          t("tag", "Nama singkat yang muncul di denah saat zona disorot atau dipilih", 24),
          img("photo1", "Foto 1 (tampil pertama)", "Disarankan mendatar 16:10 atau 16:9, minimal 1600 px lebar. Gambar dipotong mengikuti bingkai."),
          img("photo2", "Foto 2 (opsional)"),
          img("photo3", "Foto 3 (opsional)"),
          img("photo4", "Foto 4 (opsional)"),
        ],
      },
      h("legendPart", "Keterangan di bawah denah"),
      t("note", "Catatan kecil paling bawah (kosongkan untuk menyembunyikan)", 200),
    ],
  },
  {
    key: "experience",
    page: "home",
    label: "Perjalanan (7 babak)",
    description: "Tujuh babak tersusun ke bawah dengan timeline di kiri. Babak pertama dan terakhir tampil sebagai MULAI dan SELESAI, babak di antaranya bernomor.",
    fields: [
      h("timelinePart", "Penanda di timeline"),
      t("startTag", "Penanda babak pertama", 20),
      t("endTag", "Penanda babak terakhir", 20),
      t("actWord", "Kata sebelum nomor babak", 20, "Mis. Babak, menjadi BABAK 01."),
      t("flowHeading", "Judul kecil di atas alur", 40),
      {
        key: "steps",
        label: "Babak",
        type: "list",
        itemLabel: "Babak",
        itemTitle: "mood",
        hint: "Urutan gambar tiap babak tetap: e-tiket, foto, video DJ, layar AI, foto, video cetak 3D, sepatu 3D.",
        min: 3,
        max: 7,
        fields: [
          t("mood", "Nama babak (di timeline dan judul besar)", 30),
          t("title", "Subjudul babak (teks berwarna)", 70),
          ta("description", "Penjelasan", 360),
          t("minutes", "Durasi (mis. ±15 menit)", 20),
          { key: "flow", label: "Alur yang dialami pengunjung", type: "tags", hint: "Satu langkah per baris, 3 sampai 5 langkah. Kosongkan untuk babak pertama dan terakhir." },
          img("image", "Gambar babak", "Dipakai pada babak 2, 3, 5, dan 6. Babak pertama, babak 4 (Bertemu AI), dan terakhir memakai ilustrasi bawaan, jadi kolom ini diabaikan di sana. Mengganti gambar babak 3 atau 6 juga mengganti videonya dengan foto. Kosongkan untuk memakai gambar bawaan."),
        ],
      },
    ],
  },
  {
    key: "about",
    page: "home",
    label: "Tentang Hololabs",
    description: "Pengenalan singkat di kiri dan kotak angka ringkas di kanan.",
    fields: [
      t("eyebrow", "Label kecil di atas judul"),
      t("title", "Judul"),
      ta("bodyShort", "Paragraf pertama", 400),
      ta("bodyLong", "Paragraf kedua (kosongkan untuk menyembunyikan)", 500),
      {
        key: "stats",
        label: "Angka ringkas (kotak di kanan)",
        type: "list",
        itemLabel: "Angka",
        itemTitle: "value",
        min: 0,
        max: 4,
        fields: [t("value", "Angka / teks besar", 20), t("label", "Keterangan", 40)],
      },
    ],
  },
  {
    key: "visit",
    page: "home",
    label: "Reservasi",
    description: "Judul dan pengantar, dua foto ruangan (Ruang Kendali di kiri, Kursi Penonton mezzanine di kanan; diklik membuka pop up foto dan penjelasan ruangan), lalu kolom individu dan grup.",
    fields: [
      t("eyebrow", "Label kecil di atas judul"),
      t("title", "Judul", 80),
      ta("body", "Kalimat di bawah judul", 240),
      t("sceneHint", "Tulisan tombol di pojok kiri atas tiap foto (diklik membuka pop up ruangan)", 30),
      h("commandPart", "Foto kiri: Ruang Kendali"),
      t("commandFloor", "Label lantai (di foto dan pop up)", 30),
      t("commandTitle", "Nama ruangan (di foto dan pop up)", 60),
      ta("commandBody", "Pop up: penjelasan", 500),
      img("commandPhoto1", "Foto 1 (tampil di kartu dan pertama di pop up)", "Disarankan mendatar 16:10, minimal 1200 px lebar. Di kartu dipotong 4:3."),
      img("commandPhoto2", "Pop up: foto 2 (opsional)"),
      img("commandPhoto3", "Pop up: foto 3 (opsional)"),
      t("ticketNote", "Keterangan kecil di bawah foto (kosongkan untuk menyembunyikan)", 60),
      h("deckPart", "Foto kanan: Kursi Penonton (mezzanine)"),
      t("deckFloor", "Label lantai (di foto dan pop up)", 30),
      t("deckTitle", "Nama ruangan (di foto dan pop up)", 60),
      ta("deckBody", "Pop up: penjelasan", 500),
      img("deckPhoto1", "Foto 1 (tampil di kartu dan pertama di pop up)", "Disarankan mendatar 16:10, minimal 1200 px lebar. Di kartu dipotong 4:3."),
      img("deckPhoto2", "Pop up: foto 2 (opsional)"),
      img("deckPhoto3", "Pop up: foto 3 (opsional)"),
      t("deckNote", "Keterangan kecil di bawah foto (kosongkan untuk menyembunyikan)", 60),
      h("personalPart", "Kolom kiri: individu"),
      t("personalTitle", "Judul", 60),
      ta("personalBody", "Penjelasan", 240),
      { key: "personalTags", label: "Label", type: "tags", hint: "Satu label per baris." },
      t("personalCta", "Tombol (menuju halaman booking)", 40),
      h("groupPart", "Kolom kanan: sekolah, perusahaan & merek"),
      t("groupTitle", "Judul", 60),
      ta("groupBody", "Penjelasan", 240),
      { key: "groupTags", label: "Label", type: "tags", hint: "Satu label per baris." },
      t("groupCta", "Tombol (membuka WhatsApp)", 40),
      ta("groupMessage", "Pesan WhatsApp otomatis saat tombol diklik", 300),
    ],
  },
  {
    key: "faq",
    page: "home",
    label: "Tanya jawab (FAQ)",
    description: "Judul dan ajakan WhatsApp di kiri, daftar pertanyaan di kanan; jawaban terbuka saat pertanyaan diklik.",
    fields: [
      t("title", "Judul"),
      t("askPrompt", "Kalimat di bawah judul", 80),
      t("askLink", "Teks link WhatsApp (lanjutan kalimat)", 60),
      {
        key: "items",
        label: "Pertanyaan",
        type: "list",
        itemLabel: "Pertanyaan",
        itemTitle: "question",
        min: 0,
        max: 20,
        fields: [t("question", "Pertanyaan", 160), ta("answer", "Jawaban", 600)],
      },
    ],
  },
  {
    key: "contact",
    page: "home",
    label: "Footer & kontak",
    description: "Kolom paling bawah: nama dan deskripsi singkat, tombol Instagram dan WhatsApp, kolom Kontak berisi alamat dan nomor, serta tombol WhatsApp bulat di pojok kanan bawah.",
    fields: [
      t("footerTagline", "Deskripsi singkat di bawah nama", 80),
      t("instagram", "Instagram (tanpa @)", 60),
      t("contactHeading", "Judul kolom kontak", 30),
      ta("address", "Alamat (satu baris per alamat)", 200, "Juga dipakai di peta lokasi dan email."),
      t("whatsapp", "Nomor WhatsApp (format 08…)", 20, "Juga dipakai untuk tombol WhatsApp di FAQ, kolom grup, dan konfirmasi pembayaran."),
      h("floatPart", "Tombol WhatsApp bulat (pojok kanan bawah)", "Selalu terlihat saat di-scroll, di beranda, halaman booking, pembayaran, dan e-tiket."),
      t("floatWhatsapp", "Nomor WhatsApp tombol", 20, "Format 08… (spasi boleh). Tampil apa adanya saat tombol disorot. Kosongkan untuk menyembunyikan tombol."),
      t("floatLabel", "Tulisan kecil di atas nomor saat disorot", 40),
      ta("floatMessage", "Pesan awal otomatis di WhatsApp (opsional)", 300),
    ],
  },
  {
    key: "location",
    page: "home",
    label: "Peta lokasi (footer)",
    description: "Gambar peta di footer. Saat diklik membuka Google Maps.",
    fields: [
      url("mapLink", "Link Google Maps", "Tempel link dari Google Maps (https://…)."),
      t("cardCta", "Teks tombol di atas peta", 40),
    ],
  },
  {
    key: "booking",
    page: "other",
    label: "Halaman booking & pembayaran",
    description: "Halaman /booking dan halaman pembayaran: judul tiap langkah, rekening tujuan transfer, cara transfer, dan syarat & ketentuan.",
    fields: [
      h("bookingPart", "Halaman booking"),
      t("pageEyebrow", "Label kecil", 30),
      t("pageTitle", "Judul (bagian putih)", 60),
      t("pageTitleAccent", "Judul (bagian gradien)", 60),
      { key: "stepLabels", label: "Nama 5 langkah booking", type: "tags", hint: "Tepat lima baris: jadwal, pilih kursi, data diri, ketentuan, pembayaran." },
      t("dateTitle", "Langkah 1: judul pilih tanggal", 40),
      t("timeTitle", "Langkah 1: judul pilih jam", 40),
      t("seatTitle", "Langkah 1: judul pilih kursi", 40),
      t("dataTitle", "Langkah 2: judul data pemesan", 40),
      t("dataNote", "Langkah 2: keterangan di bawah judul", 120),
      t("termsTitle", "Langkah 3: judul ketentuan", 40),
      {
        key: "terms",
        label: "Syarat & ketentuan",
        type: "list",
        itemLabel: "Poin",
        min: 1,
        max: 20,
        fields: [ta("text", "Isi poin", 400)],
      },
      t("paymentTitle", "Langkah 4: judul pembayaran", 40),
      h("payPart", "Halaman pembayaran"),
      t("payEyebrow", "Label kecil", 30),
      t("payTitle", "Judul (bagian putih)", 60),
      t("payTitleAccent", "Judul (bagian gradien)", 60),
      t("payLead", "Kalimat di bawah judul", 160),
      t("bank", "Nama bank", 30),
      t("holder", "Atas nama rekening", 80),
      t("accountNumber", "Nomor rekening", 40),
      {
        key: "guides",
        label: "Cara transfer",
        type: "list",
        itemLabel: "Panduan",
        itemTitle: "title",
        min: 0,
        max: 6,
        fields: [
          t("title", "Judul panduan", 60),
          { key: "steps", label: "Langkah-langkah", type: "tags", hint: "Satu langkah per baris. Boleh memakai {rekening}, {atasnama}, dan {bank}; terisi otomatis." },
        ],
      },
    ],
  },
  {
    key: "eticket",
    page: "other",
    label: "Email otomatis (transfer, verifikasi, e-tiket)",
    description:
      "Tiga email yang dikirim otomatis, urut sesuai alur: (1) saat tamu selesai memesan, berisi rekening dan nominal transfer; (2) saat tamu melaporkan transfer; (3) saat admin mengonfirmasi pembayaran, berisi e-tiket dan QR. Kata dalam kurung kurawal diganti otomatis: {nama}, {booking}, {jadwal}, {kursi}, {jumlah}, {batas} (batas waktu transfer, hanya email 1).",
    fields: [
      h("mail1", "Email 1: selesaikan transfer"),
      t("instructSubject", "Subjek", 120),
      { key: "instructBody", label: "Isi", type: "textarea", max: 600, hint: "Pisahkan paragraf dengan satu baris kosong." },
      h("mail2", "Email 2: sedang diverifikasi"),
      t("verifySubject", "Subjek", 120),
      { key: "verifyBody", label: "Isi", type: "textarea", max: 900, hint: "Pisahkan paragraf dengan satu baris kosong." },
      h("mail3", "Email 3: pembayaran berhasil (e-tiket)"),
      t("emailSubject", "Subjek", 120),
      { key: "emailBody", label: "Isi", type: "textarea", max: 900, hint: "Pisahkan paragraf dengan satu baris kosong. QR check-in, tombol e-tiket dan lokasi ditempel otomatis di bawahnya." },
    ],
  },
  {
    key: "pages",
    page: "other",
    label: "Halaman 404",
    description: "Halaman yang tampil saat alamat tidak ditemukan.",
    fields: [t("notFoundTitle", "Judul", 80), ta("notFoundBody", "Penjelasan", 240)],
  },
] as const satisfies readonly SectionDef[];

export type SectionKey = (typeof sections)[number]["key"];

/** Built-in photos and description of one showroom zone, for the Reservasi room pop ups. */
const zoneText = (id: string) => showroomZones.find((z) => z.id === id) ?? { description: "", photos: [] as string[] };

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
  },
  hero: {
    badge: "IMERSIF · INTERAKTIF · CERDAS",
    title: "Jangan cuma melihat teknologinya.",
    titleAccent: "Masuk dan rasakan sendiri.",
    lead: "Satu pertunjukan, 90 menit, 7 babak. Dari proyeksi video imersif sampai pulang membawa karya cetak 3D buatanmu sendiri.",
    ctaPrimary: "Pilih Jadwal Pertunjukan",
    ctaSecondary: "Lihat Perjalanan",
  },
  showroom: showroomDefaults,
  experience: {
    startTag: "Mulai",
    endTag: "Selesai",
    actWord: "Babak",
    flowHeading: "Yang kamu alami",
    steps: experienceSteps.map(({ mood, title, description, minutes, flow, image }) => ({ mood, title, description, minutes, flow, image })),
  },
  visit: {
    eyebrow: "Reservasi",
    title: "Kursinya sedikit. Amankan sekarang.",
    body: "Pilih tanggal dan jam pertunjukan, bayar daring, lalu e-tiket ber-QR langsung dikirim ke email kamu.",
    sceneHint: "Lihat ruangan",
    ticketNote: "",
    commandFloor: "Lantai 1",
    commandTitle: "Ruang Kendali",
    commandBody: zoneText("command").description,
    commandPhoto1: zoneText("command").photos[0] ?? "",
    commandPhoto2: zoneText("command").photos[1] ?? "",
    commandPhoto3: zoneText("command").photos[2] ?? "",
    deckNote: "",
    deckFloor: "Mezzanine",
    deckTitle: "Kursi Penonton",
    deckBody: zoneText("viewing").description,
    // the mezzanine view first: it shows the seating best
    deckPhoto1: "/showroom/36.jpg",
    deckPhoto2: "/showroom/34.jpg",
    deckPhoto3: "/showroom/35.jpg",
    personalTitle: "Individu, teman & keluarga",
    personalBody: "Pilih tanggal dan jam pertunjukan, bayar daring, kursi langsung tercatat. Maksimal 6 orang per pemesanan.",
    personalTags: ["Individu", "Teman & Keluarga", "Komunitas"],
    personalCta: "Pilih Jadwal Pertunjukan",
    groupTitle: "Sekolah, perusahaan & merek",
    groupBody: "Pertunjukan privat, karyawisata, kegiatan tim, atau aktivasi merek. Hubungi kami untuk jadwal dan penawaran.",
    groupTags: ["Sekolah & Kampus", "Perusahaan & Tim", "Merek & Klien", "Grup Privat"],
    groupCta: "Ajukan pertunjukan privat lewat WhatsApp",
    groupMessage:
      "Halo Hololabs, saya ingin mengajukan pertunjukan privat / kunjungan rombongan.\nNama instansi:\nPerkiraan jumlah orang:\nTanggal yang diinginkan:",
  },
  about: {
    eyebrow: "Apa itu Hololabs",
    title: "Tempat teknologi menjadi pengalaman.",
    bodyShort:
      "Hololabs adalah laboratorium teknologi kreatif dari Holomoc. Proyeksi video, AI, rumah pintar, dan cetak 3D dirangkai jadi satu perjalanan yang bisa kamu lihat, dengar, sentuh, dan ajak bicara.",
    bodyLong: "",
    stats: visitStats.map(({ value, label }) => ({ value, label })),
  },
  location: {
    mapLink: "https://maps.google.com/?q=Jl.+Duren+Sawit+Indah+Blok+K1+No+10+Klender+Jakarta+Timur",
    cardCta: "Buka di Google Maps",
  },
  faq: {
    title: "Pertanyaan umum",
    askPrompt: "Masih ada pertanyaan?",
    askLink: "Hubungi kami di WhatsApp",
    items: faqItems.map(({ question, answer }) => ({ question, answer })),
  },
  booking: {
    pageEyebrow: "PEMESANAN",
    pageTitle: "Pesan",
    pageTitleAccent: "Perjalanan HOLOLABS",
    stepLabels: ["Jadwal", "Pilih kursi", "Data diri", "Ketentuan", "Pembayaran"],
    dateTitle: "Pilih tanggal",
    timeTitle: "Pilih jam pertunjukan",
    seatTitle: "Pilih kursi",
    dataTitle: "Data pemesan",
    dataNote: "E-tiket dikirim ke email dan nomor ini.",
    termsTitle: "Syarat & ketentuan",
    paymentTitle: "Pembayaran",
    payEyebrow: "PESANAN DIBUAT",
    payTitle: "Kursimu",
    payTitleAccent: "sudah ditahan.",
    payLead: 'Transfer sesuai nominal di bawah, lalu tekan "Saya sudah transfer".',
    guides: [
      {
        title: "myBCA / BCA mobile",
        steps: [
          "Buka myBCA atau BCA mobile (m-BCA), pilih Transfer.",
          "Pilih Antar Rekening BCA, masukkan nomor {rekening}.",
          "Pastikan nama penerima {atasnama}.",
          "Masukkan nominal PERSIS seperti tagihan, termasuk 3 digit terakhir.",
          "Konfirmasi, lalu simpan bukti transfer.",
        ],
      },
      {
        title: "Dari bank lain / dompet digital",
        steps: [
          "Pilih Transfer ke bank lain (BI-FAST atau daring).",
          "Pilih bank tujuan {bank}, nomor rekening {rekening}.",
          "Pastikan nama penerima {atasnama}.",
          "Masukkan nominal PERSIS seperti tagihan, termasuk 3 digit terakhir.",
          "Biaya transfer antarbank (bila ada) ditanggung pengirim.",
        ],
      },
      {
        title: "ATM",
        steps: [
          "Pilih Transfer, lalu ke rekening {bank} (atau bank lain dari ATM non-{bank}).",
          "Masukkan nomor rekening {rekening} dan nominal persis.",
          "Pastikan nama penerima {atasnama}, lalu konfirmasi. Simpan struknya.",
        ],
      },
    ],
    bank: "BCA",
    holder: "Chandra Kirana",
    accountNumber: "527 159 4608",
    terms: [
      "Tiket berlaku untuk tanggal dan jam pertunjukan yang dipilih. Datang paling lambat 15 menit sebelum pertunjukan untuk registrasi.",
      "Pertunjukan berlangsung sekitar 90 menit. Keterlambatan tidak memperpanjang durasi pertunjukan.",
      "Anak usia 2 tahun ke atas dihitung sebagai 1 pengunjung dan memerlukan tiket.",
      "Selesaikan transfer dalam 120 menit dengan nominal persis sesuai tagihan (termasuk kode unik). Lewat dari itu, pesanan batal otomatis dan kursi dilepas.",
      "Pesanan berlaku setelah pembayaran diverifikasi tim HOLOLABS. E-tiket dikirim ke email setelah terverifikasi.",
      "Ganti jadwal bisa dilakukan 1 kali, paling lambat 24 jam sebelum pertunjukan, lewat WhatsApp HOLOLABS.",
      "Tiket yang sudah dibayar tidak dapat diuangkan kembali, tetapi bisa dipindah ke jadwal lain sesuai aturan ganti jadwal.",
      "Demi keamanan, beberapa area hanya boleh dimasuki dengan pendampingan kru. Ikuti arahan kru selama pertunjukan.",
      "Data kontakmu hanya dipakai untuk keperluan reservasi dan kunjungan ke HOLOLABS.",
    ].map((text) => ({ text })),
  },
  pages: {
    notFoundTitle: "Halaman ini tidak ditemukan",
    notFoundBody: "Tautannya mungkin salah ketik, atau halaman yang kamu cari sudah dipindahkan.",
  },
  eticket: {
    instructSubject: "Transfer sebelum {batas} · {booking}",
    instructBody: "Halo {nama}, kursimu sudah kami tahan. Transfer sebelum {batas} supaya tidak dilepas.",
    verifySubject: "Pembayaran {booking} sedang kami verifikasi",
    verifyBody: [
      "Halo {nama}, terima kasih. Laporan transfermu sudah kami terima dan sedang dicocokkan dengan mutasi rekening, biasanya selesai dalam beberapa jam kerja.",
      "Begitu pembayaran terkonfirmasi, e-tiket beserta QR registrasi langsung dikirim ke email ini. Kursimu tetap ditahan selama proses berlangsung.",
    ].join("\n\n"),
    emailSubject: "E-tiket HOLOLABS · {booking}",
    emailBody: "Pembayaran diterima. Sampai jumpa di HOLOLABS, {nama}!",
  },
  contact: {
    whatsapp: String(siteConfig.whatsapp),
    instagram: "hololabs.id",
    address: "Jl. Duren Sawit Indah, Blok K1 No 10, RT.5/RW.3, Klender\nKec. Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13440",
    footerTagline: "Laboratorium teknologi kreatif dari Holomoc",
    contactHeading: "Kontak",
    floatWhatsapp: "0816 7123 39",
    floatLabel: "Chat WhatsApp",
    floatMessage: "",
  },
};

export type SiteContent = typeof defaults;

export function sectionDef(key: string): SectionDef | undefined {
  return (sections as readonly SectionDef[]).find((s) => s.key === key);
}
