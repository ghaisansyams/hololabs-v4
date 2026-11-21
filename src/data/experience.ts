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
    description: "Scan e-ticket QR di pintu masuk, lalu duduk di kursimu.",
    minutes: "5 menit",
  },
  {
    mood: "Amazed",
    title: "Journey of Life",
    description: "Video mapping imersif dengan surround audio dan tata cahaya.",
    minutes: "20 menit",
  },
  {
    mood: "Energized",
    title: "Interactive DJ Performance",
    description: "Visual yang bereaksi pada musik dan gerakanmu.",
    minutes: "15 menit",
  },
  {
    mood: "Connected",
    title: "Konsultasi dengan Holomedis AI",
    description: "AI agentic dokter yang mendengar keluhanmu dan menyiapkan konsultasi dengan dokter.",
    minutes: "15 menit",
  },
  {
    mood: "Inspired",
    title: "Road to Smart Living",
    description: "Rumah yang merespons suara: lampu, tirai, dan suasana.",
    minutes: "15 menit",
  },
  {
    mood: "Create",
    title: "Custom 3D Printing",
    description: "Kustomisasi desainmu dan lihat prosesnya lapis demi lapis.",
    minutes: "15 menit",
  },
  {
    mood: "Remember",
    title: "Bawa pulang karyamu",
    description: "Ambil hasil 3D print-mu dan bawa pulang kenangan dari HOLOLABS.",
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
