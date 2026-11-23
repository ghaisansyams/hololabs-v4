import { siteConfig } from "@/data/site";
import { experienceSteps, visitStats } from "@/data/experience";
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
    description: "Teks tombol Reservasi dan tautan menu di header (juga dipakai di kolom Menu footer).",
    fields: [
      t("reservationLabel", "Teks tombol Reservasi", 30),
      {
        key: "menuItems",
        label: "Isi menu",
        type: "list",
        itemLabel: "Menu",
        min: 1,
        max: 10,
        fields: [t("label", "Nama menu", 30), url("href", "Tujuan link", "Mis. /#faq atau /cek-tiket")],
      },
    ],
  },
  {
    key: "hero",
    label: "Hero (bagian paling atas)",
    description: "Layar pertama: foto latar penuh, judul besar, kalimat pembuka, dan dua tombol. Journey 3D dimulai di bawahnya.",
    fields: [
      t("badge", "Label kecil di atas judul"),
      t("title", "Judul (bagian putih)"),
      t("titleAccent", "Judul (bagian berwarna gradien)"),
      ta("lead", "Kalimat pembuka"),
      t("ctaPrimary", "Teks tombol utama (menuju reservasi)", 40),
      t("ctaSecondary", "Teks tombol kedua (menuju journey)", 40),
    ],
  },
  {
    key: "experience",
    label: "Journey 3D (7 babak)",
    description:
      "Tujuh babak yang dilewati kamera 3D saat halaman di-scroll. Urutan gambar tiap babak tetap; nama babak, subjudul, penjelasan, durasi, dan alur bisa diubah. Babak pertama dan terakhir tampil di timeline sebagai START dan END.",
    fields: [
      {
        key: "steps",
        label: "Babak",
        type: "list",
        itemLabel: "Babak",
        min: 3,
        max: 7,
        fields: [
          t("mood", "Nama babak di timeline (mis. Feel the Beat)", 30),
          t("title", "Subjudul babak (mis. Interactive DJ Performance)", 70),
          ta("description", "Penjelasan", 360),
          t("minutes", "Durasi (mis. ±15 menit)", 20),
          { key: "flow", label: "Alur yang dialami pengunjung", type: "tags", hint: "Satu langkah per baris, 3 sampai 5 langkah. Kosongkan untuk babak pertama dan terakhir." },
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
      t("ticketNote", "Keterangan di bawah ilustrasi kursi 3D", 60),
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
    key: "location",
    label: "Lokasi",
    description: "Link Google Maps yang muncul di footer dan di bagian reservasi.",
    fields: [
      url("mapLink", "Link Google Maps", "Tempel link dari Google Maps (https://…)."),
      t("cardCta", "Teks link Google Maps", 40),
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Pertanyaan yang sering diajukan. Judul di kiri, daftar pertanyaan di kanan; jawaban terbuka saat pertanyaan diklik.",
    fields: [
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
    key: "booking",
    label: "Booking & pembayaran",
    description:
      "Halaman /booking (sama dengan hololabs.id/booking): rekening tujuan transfer dan syarat & ketentuan yang harus disetujui tamu sebelum membayar.",
    fields: [
      t("pageEyebrow", "Halaman booking: label kecil", 30),
      t("pageTitle", "Halaman booking: judul (bagian putih)", 60),
      t("pageTitleAccent", "Halaman booking: judul (bagian gradien)", 60),
      { key: "stepLabels", label: "Nama 5 langkah booking", type: "tags", hint: "Tepat lima baris: jadwal, pilih kursi, data diri, ketentuan, pembayaran." },
      t("dateTitle", "Langkah 1: judul pilih tanggal", 40),
      t("timeTitle", "Langkah 1: judul pilih jam", 40),
      t("seatTitle", "Langkah 1: judul pilih kursi", 40),
      t("dataTitle", "Langkah 2: judul data pemesan", 40),
      t("dataNote", "Langkah 2: keterangan di bawah judul", 120),
      t("termsTitle", "Langkah 3: judul ketentuan", 40),
      t("paymentTitle", "Langkah 4: judul pembayaran", 40),
      t("payEyebrow", "Halaman pembayaran: label kecil", 30),
      t("payTitle", "Halaman pembayaran: judul (bagian putih)", 60),
      t("payTitleAccent", "Halaman pembayaran: judul (bagian gradien)", 60),
      t("payLead", "Halaman pembayaran: kalimat di bawah judul", 160),
      {
        key: "guides",
        label: "Cara transfer",
        type: "list",
        itemLabel: "Panduan",
        min: 0,
        max: 6,
        fields: [
          t("title", "Judul panduan", 60),
          { key: "steps", label: "Langkah-langkah", type: "tags", hint: "Satu langkah per baris. Boleh memakai {rekening}, {atasnama}, dan {bank}; terisi otomatis." },
        ],
      },
      t("bank", "Nama bank", 30),
      t("holder", "Atas nama rekening", 80),
      t("accountNumber", "Nomor rekening", 40),
      {
        key: "terms",
        label: "Syarat & ketentuan",
        type: "list",
        itemLabel: "Poin",
        min: 1,
        max: 20,
        fields: [ta("text", "Isi poin", 400)],
      },
    ],
  },
  {
    key: "pages",
    label: "Halaman lain (Cek Tiket & 404)",
    description: "Teks halaman Cek & Check-in Tiket dan halaman \"tidak ditemukan\".",
    fields: [
      t("cekTitle", "Cek Tiket: judul", 60),
      ta("cekBody", "Cek Tiket: penjelasan", 300),
      t("notFoundTitle", "404: judul", 80),
      ta("notFoundBody", "404: penjelasan", 240),
    ],
  },
  {
    key: "eticket",
    label: "Pesan e-ticket (WhatsApp & email)",
    description:
      "Teks yang terisi otomatis saat admin menekan Kirim e-ticket di halaman Booking. Pesan dikirim lewat WhatsApp dan Gmail milik admin, bukan lewat sistem otomatis. Kata dalam kurung kurawal diganti otomatis: {nama}, {booking}, {link}, {jadwal}, {kursi}, {jumlah}.",
    fields: [
      { key: "waMessage", label: "Pesan WhatsApp", type: "textarea", max: 900, hint: "Tanda *teks* membuat huruf tebal di WhatsApp. Pastikan {link} ada, karena itu tautan e-ticket." },
      t("emailSubject", "Email: subjek", 120),
      { key: "emailBody", label: "Email: isi", type: "textarea", max: 1200, hint: "Pastikan {link} ada." },
    ],
  },
  {
    key: "contact",
    label: "Kontak & footer",
    description: "Nomor WhatsApp (dipakai juga untuk tombol konfirmasi pembayaran), Instagram, alamat, dan deskripsi singkat di footer.",
    fields: [
      t("whatsapp", "Nomor WhatsApp (format 08…)", 20),
      t("instagram", "Instagram (tanpa @)", 60),
      ta("address", "Alamat (satu baris per alamat)", 200),
      t("footerTagline", "Deskripsi singkat di bawah nama (footer)", 80),
      t("footerCopyright", "Teks hak cipta (tanpa tahun)", 80),
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
  },
  hero: {
    badge: "IMMERSIVE · INTERACTIVE · INTELLIGENT",
    title: "Don't just see the technology.",
    titleAccent: "Step inside it.",
    lead: "Satu show, 90 menit, 7 babak. Dari video mapping imersif sampai pulang membawa karya 3D print buatanmu sendiri.",
    ctaPrimary: "Pilih Jadwal Show",
    ctaSecondary: "Lihat Journey",
  },
  experience: {
    steps: experienceSteps.map(({ mood, title, description, minutes, flow }) => ({ mood, title, description, minutes, flow })),
  },
  visit: {
    stats: visitStats.map(({ value, label }) => ({ value, label })),
    eyebrow: "Reservasi",
    title: "Kursinya sedikit. Amankan sekarang.",
    body: "Pilih tanggal dan show, bayar online, dan e-ticket QR langsung dikirim ke email kamu.",
    cta: "Booking Sekarang",
    ticketNote: "Ilustrasi ruang show HOLOLABS: 18 kursi per show",
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
  location: {
    mapLink: "https://maps.google.com/?q=Jl.+Duren+Sawit+Indah+Blok+K1+No+10+Klender+Jakarta+Timur",
    cardCta: "Buka di Google Maps",
  },
  faq: {
    title: "Pertanyaan umum",
    items: faqItems.map(({ question, answer }) => ({ question, answer })),
  },
  booking: {
    pageEyebrow: "BOOKING",
    pageTitle: "Pesan",
    pageTitleAccent: "Experience Journey",
    stepLabels: ["Jadwal", "Pilih kursi", "Data diri", "Ketentuan", "Pembayaran"],
    dateTitle: "Pilih tanggal",
    timeTitle: "Pilih jam show",
    seatTitle: "Pilih kursi",
    dataTitle: "Data pemesan",
    dataNote: "E-ticket dikirim ke email dan nomor ini.",
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
        title: "Dari bank lain / e-wallet",
        steps: [
          "Pilih Transfer ke bank lain (BI-FAST atau online).",
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
      "Tiket berlaku untuk tanggal dan jam show yang dipilih. Datang paling lambat 15 menit sebelum show untuk check-in.",
      "Show berlangsung sekitar 90 menit. Keterlambatan tidak memperpanjang durasi show.",
      "Anak usia 2 tahun ke atas dihitung sebagai 1 pengunjung dan memerlukan tiket.",
      "Selesaikan transfer dalam 120 menit dengan nominal persis sesuai tagihan (termasuk kode unik). Lewat dari itu, pesanan batal otomatis dan kursi dilepas.",
      "Pesanan berlaku setelah pembayaran diverifikasi tim HOLOLABS. E-ticket dikirim ke email setelah terverifikasi.",
      "Reschedule bisa dilakukan 1 kali, paling lambat 24 jam sebelum show, lewat WhatsApp HOLOLABS.",
      "Tiket yang sudah dibayar tidak dapat diuangkan kembali, tetapi bisa dipindah ke jadwal lain sesuai aturan reschedule.",
      "Demi keamanan, beberapa area hanya boleh dimasuki dengan pendampingan kru. Ikuti arahan kru selama show.",
      "Data kontakmu hanya dipakai untuk keperluan reservasi dan kunjungan ke HOLOLABS.",
    ].map((text) => ({ text })),
  },
  pages: {
    cekTitle: "Cek & Check-in Tiket",
    cekBody:
      "Untuk petugas di lokasi: masukkan nomor booking dan nomor WhatsApp pemesan untuk memvalidasi dan mencatat kehadiran.",
    notFoundTitle: "Halaman ini tidak ditemukan",
    notFoundBody: "Tautannya mungkin salah ketik, atau halaman yang kamu cari sudah dipindahkan.",
  },
  eticket: {
    waMessage: [
      "Halo Kak {nama}!",
      "",
      "Pembayaran booking *{booking}* sudah kami terima. Ini e-ticket kamu untuk HOLOLABS Experience Journey:",
      "{link}",
      "",
      "Jadwal: {jadwal}",
      "Kursi: {kursi}",
      "",
      "Tunjukkan QR di e-ticket saat check-in, dan datang 10 menit sebelum show dimulai.",
      "Sampai ketemu di HOLOLABS!",
    ].join("\n"),
    emailSubject: "E-Ticket HOLOLABS · {booking}",
    emailBody: [
      "Halo {nama},",
      "",
      "Pembayaran untuk booking {booking} sudah kami terima. E-ticket kamu bisa dibuka di tautan ini:",
      "{link}",
      "",
      "Jadwal : {jadwal}",
      "Kursi  : {kursi}",
      "Jumlah : {jumlah}",
      "",
      "Tunjukkan QR di e-ticket saat check-in, dan datang 10 menit sebelum show dimulai. E-ticket juga bisa disimpan sebagai PDF dari halaman tersebut.",
      "",
      "Sampai ketemu di HOLOLABS!",
      "Tim HOLOLABS",
    ].join("\n"),
  },
  contact: {
    whatsapp: String(siteConfig.whatsapp),
    instagram: "hololabs.id",
    address: "Jl. Duren Sawit Indah, Blok K1 No 10, RT.5/RW.3, Klender\nKec. Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13440",
    footerTagline: "A creative technology lab by Holomoc",
    footerCopyright: "Hololabs by Holomoc. Seluruh hak dilindungi.",
  },
};

export type SiteContent = typeof defaults;

export function sectionDef(key: string): SectionDef | undefined {
  return (sections as readonly SectionDef[]).find((s) => s.key === key);
}
