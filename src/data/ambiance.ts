/**
 * "Ambiance" — per the revision notes (Spero x Hololabs, meeting re:
 * Meat Guy Steakhouse reference, Oct 2026): this section introduces the
 * venue/atmosphere only, not the immersive content itself (that's
 * Collection). Kept short — one mood statement plus a few numbers.
 */
export interface AmbianceStat {
  value: string;
  label: string;
}

export const ambianceStats: AmbianceStat[] = [
  { value: "±90 min", label: "Satu Experience Journey" },
  { value: "8", label: "Zona dalam satu ruang" },
  { value: "1–50", label: "Orang / sesi, individu sampai grup" },
];

export interface AmbiancePhase {
  title: string;
  time: string;
  description: string;
  tags: string[];
}

/** Placeholder journey until the final run-of-show is confirmed; editable in the CMS. */
export const ambiancePhases: AmbiancePhase[] = [
  {
    title: "Masuk ke ruang",
    time: "Menit 0–10",
    description:
      "Pintu terbuka ke lorong yang redup. Cahaya menyala pelan mengikuti langkah, dan pemandu sesi menjelaskan cara bergerak di dalam ruang.",
    tags: ["Lorong cahaya", "Pemandu sesi"],
  },
  {
    title: "Cahaya dan pantulan",
    time: "Menit 10–35",
    description:
      "Lantai, dinding kaca, dan layar saling memantulkan gambar. Ruang terasa dua kali lebih dalam, dan tubuh Anda ikut menjadi bagian dari tampilan.",
    tags: ["Lantai reflektif", "Dinding kaca"],
  },
  {
    title: "Ruang berubah bentuk",
    time: "Menit 35–70",
    description:
      "Proyeksi menggeser batas ruangan. Dinding menjadi pegunungan, langit-langit menjadi galaksi, lalu semuanya melipat kembali menjadi satu koridor.",
    tags: ["Proyeksi 360°", "8 zona"],
  },
  {
    title: "Berinteraksi dan pulang",
    time: "Menit 70–90",
    description:
      "Di akhir, gerakan Anda mengubah cahaya dan suara di sekitar. Sesi ditutup di area keluar, tempat foto dan tiket kenangan menunggu.",
    tags: ["Sensor gerak", "Area foto"],
  },
];

export interface AmbianceFact {
  label: string;
  value: string;
}

export const ambianceFacts: AmbianceFact[] = [
  { label: "Durasi", value: "Sekitar 90 menit sejak masuk sampai keluar ruang." },
  { label: "Kapasitas", value: "Maksimal 13 kursi per show. Grup lebih dari 13 orang dipecah ke dua sesi." },
  { label: "Pakaian", value: "Bebas dan nyaman. Pakai alas kaki tertutup, karena sebagian lantai reflektif." },
  { label: "Suhu ruang", value: "Sejuk, sekitar 22°C. Bawa outer tipis jika mudah kedinginan." },
  { label: "Aksesibilitas", value: "Jalur kursi roda tersedia di seluruh zona. Beri tahu kami lewat WhatsApp sebelum hari-H." },
  { label: "Foto dan video", value: "Boleh untuk dokumentasi pribadi, tanpa flash dan tanpa tripod." },
];
