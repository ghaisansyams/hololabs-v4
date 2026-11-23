/**
 * The seven chapters ("babak") of one Hololabs show, as presented on
 * hololabs.id. Editable from the CMS (Konten Website -> Journey); the
 * photography shown with each chapter is fixed in code (see
 * components/home/experience-stage.tsx).
 */
export interface ExperienceStep {
  /** Chapter name, shown on the timeline and as the heading (e.g. "Feel the Beat"). */
  mood: string;
  /** What the chapter is, under the heading (e.g. "Interactive DJ Performance"). */
  title: string;
  description: string;
  minutes: string;
  /** What the guest goes through, in order; shown as a little flow under the text. */
  flow: string[];
}

/*
 * Chapters 2-6 follow the HOLOLABS company profile ("The Journey" and
 * "90 Minutes Experience" pages): names, descriptions, icon flows, durations.
 */
export const experienceSteps: ExperienceStep[] = [
  {
    mood: "Curious",
    title: "Check-in & ambil kursi",
    description: "Scan e-ticket QR di pintu masuk, lalu duduk di kursi yang sudah kamu pilih.",
    minutes: "5 menit",
    flow: [],
  },
  {
    mood: "Enter the Story",
    title: "Journey of Life · Immersive Video Mapping",
    description:
      "Show dibuka dengan video mapping yang membawamu mengikuti cerita visual tentang perjalanan hidup. Proyeksi di sekeliling ruangan, suara, dan tata cahaya bergerak bersama, jadi kamu ikut berada di dalam ceritanya.",
    minutes: "±15 menit",
    flow: ["Lihat", "Dengar", "Masuk ke cerita", "Rasakan"],
  },
  {
    mood: "Feel the Beat",
    title: "Interactive DJ & Audio Reactive Performance",
    description:
      "Musik dari DJ menjadi pemicu visual. Soundtrack, proyeksi, dan visual yang bereaksi pada suara bertemu dalam satu pertunjukan live, dan visual di layar ikut bergerak mengikuti ketukan dan gerakan penonton. Di babak ini kamu ikut jadi bagian dari pertunjukan.",
    minutes: "±15 menit",
    flow: ["Musik", "Visual", "Interaksi", "Jadi bagian show"],
  },
  {
    mood: "Meet AI",
    title: "Asisten Virtual AI Berwujud Avatar 3D",
    description:
      "Saatnya bicara dengan teknologi. Kamu bisa bertanya dan mengobrol langsung dengan AI Health Assistant, asisten virtual berwujud avatar 3D yang mendengarkan suaramu lalu menjawab. Coba ceritakan keluhan kesehatanmu, dan ia membantu mencatatnya sebelum kamu berkonsultasi dengan dokter.",
    minutes: "±15 menit",
    flow: ["Tanya", "Bicara", "Interaksi", "Temukan"],
  },
  {
    mood: "Road to Smart Living",
    title: "Dari Rumah Biasa ke Rumah Pintar",
    description:
      "Jelajahi perkembangan teknologi rumah, dari cara hidup konvensional sampai rumah yang terhubung dan cerdas. Ucapkan perintah, lalu lihat lampu, tirai, dan suasana ruangan berubah: gambaran cara kita hidup bersama teknologi di masa depan.",
    minutes: "±20 menit",
    flow: ["Perangkat", "Terhubung", "Otomatis", "Dibantu AI", "Rumah pintar"],
  },
  {
    mood: "Create Something",
    title: "Custom 3D Printing",
    description:
      "Dari dunia digital kembali ke dunia fisik. Kamu mengubah sebuah desain 3D sesuai seleramu, lalu melihat printer membangunnya lapis demi lapis sampai menjadi benda nyata yang bisa kamu pegang.",
    minutes: "±15 menit",
    flow: ["Ide", "Desain 3D", "Kustomisasi", "Cetak", "Benda nyata"],
  },
  {
    mood: "Remember",
    title: "Bawa pulang karyamu",
    description: "Ambil hasil 3D print-mu dan bawa pulang sebagai kenang-kenangan dari HOLOLABS.",
    minutes: "5 menit",
    flow: [],
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
