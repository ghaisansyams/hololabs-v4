/**
 * The seven chapters ("babak") of one Hololabs show, as presented on
 * hololabs.id. Editable from the CMS (Konten Website -> Journey); the
 * photography shown with each chapter is fixed in code (see
 * components/home/experience-stage.tsx).
 */
export interface ExperienceStep {
  mood: string;
  title: string;
  description: string;
  minutes: string;
}

export const experienceSteps: ExperienceStep[] = [
  {
    mood: "Curious",
    title: "Check-in & ambil kursi",
    description: "Scan e-ticket QR di pintu masuk, lalu duduk di kursi yang sudah kamu pilih.",
    minutes: "5 menit",
  },
  {
    mood: "Amazed",
    title: "Journey of Life",
    description: "Video mapping menyala di sekelilingmu, dengan suara surround dan lampu yang ikut berubah.",
    minutes: "20 menit",
  },
  {
    mood: "Energized",
    title: "Interactive DJ Performance",
    description: "DJ memutar musik, dan visual di layar bergerak mengikuti ketukan dan gerakanmu.",
    minutes: "15 menit",
  },
  {
    mood: "Connected",
    title: "Konsultasi dengan Holomedis AI",
    description: "Ceritakan keluhanmu ke AI dokter. Ia mencatatnya dan menyiapkan konsultasi dengan dokter.",
    minutes: "15 menit",
  },
  {
    mood: "Inspired",
    title: "Road to Smart Living",
    description: "Ucapkan perintahnya, lalu lihat lampu, tirai, dan suasana rumah berubah.",
    minutes: "15 menit",
  },
  {
    mood: "Create",
    title: "Custom 3D Printing",
    description: "Ubah desain sesukamu, lalu lihat printer membangunnya lapis demi lapis.",
    minutes: "15 menit",
  },
  {
    mood: "Remember",
    title: "Bawa pulang karyamu",
    description: "Ambil hasil 3D print-mu dan bawa pulang sebagai kenang-kenangan dari HOLOLABS.",
    minutes: "5 menit",
  },
];

export interface VisitFact {
  value: string;
  label: string;
}

export const visitStats: VisitFact[] = [
  { value: "90'", label: "satu journey utuh" },
  { value: "7", label: "babak pengalaman" },
  { value: "18", label: "kursi per show" },
  { value: "Rp 100 rb", label: "per orang" },
];
