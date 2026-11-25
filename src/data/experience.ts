/**
 * The seven chapters ("babak") of one Hololabs show, as presented on
 * hololabs.id. Editable from the CMS (Konten Website -> Journey); the
 * photography shown with each chapter is fixed in code (see
 * components/home/experience-stage.tsx).
 */
export interface ExperienceStep {
  /** Chapter name, shown on the timeline and as the heading (e.g. "Rasakan Irama"). */
  mood: string;
  /** What the chapter is, under the heading (e.g. "Interactive DJ Performance"). */
  title: string;
  description: string;
  minutes: string;
  /** What the guest goes through, in order; shown as a little flow under the text. */
  flow: string[];
  /**
   * Photo shown with the chapter (a path in /public or an upload "/media/<id>").
   * Only chapters 2, 3, 5 and 6 use one; the others are drawn in 3D and ignore it.
   */
  image: string;
}

/*
 * Chapters 2-6 follow the HOLOLABS company profile ("The Journey" and
 * "90 Minutes Experience" pages): names, descriptions, icon flows, durations.
 */
export const experienceSteps: ExperienceStep[] = [
  {
    mood: "Registrasi",
    title: "Registrasi & ambil kursi",
    description: "Pindai QR e-tiket di pintu masuk, lalu duduk di kursi yang sudah kamu pilih.",
    minutes: "5 menit",
    flow: [],
    image: "",
  },
  {
    mood: "Masuk ke Cerita",
    title: "Perjalanan Hidup · Proyeksi Video Imersif",
    description:
      "Pertunjukan dibuka dengan proyeksi video yang membawamu mengikuti cerita visual tentang perjalanan hidup. Proyeksi di sekeliling ruangan, suara, dan tata cahaya bergerak bersama, jadi kamu ikut berada di dalam ceritanya.",
    minutes: "±15 menit",
    flow: ["Lihat", "Dengar", "Masuk ke cerita", "Rasakan"],
    image: "/experience/journey-of-life.jpg",
  },
  {
    mood: "Rasakan Irama",
    title: "Pertunjukan DJ Interaktif & Visual Reaktif Suara",
    description:
      "Musik dari DJ menjadi pemicu visual. Musik latar, proyeksi, dan visual yang bereaksi pada suara bertemu dalam satu pertunjukan langsung, dan visual di layar ikut bergerak mengikuti ketukan dan gerakan penonton. Di babak ini kamu ikut jadi bagian dari pertunjukan.",
    minutes: "±15 menit",
    flow: ["Musik", "Visual", "Interaksi", "Jadi bagian pertunjukan"],
    image: "/experience/dj.jpg",
  },
  {
    mood: "Bertemu AI",
    title: "Asisten Virtual AI Berwujud Avatar 3D",
    description:
      "Saatnya bicara dengan teknologi. Kamu bisa bertanya dan mengobrol langsung dengan Asisten Kesehatan AI, asisten virtual berwujud avatar 3D yang mendengarkan suaramu lalu menjawab. Coba ceritakan keluhan kesehatanmu, dan ia membantu mencatatnya sebelum kamu berkonsultasi dengan dokter.",
    minutes: "±15 menit",
    flow: ["Tanya", "Bicara", "Interaksi", "Temukan"],
    image: "",
  },
  {
    mood: "Menuju Rumah Pintar",
    title: "Dari Rumah Biasa ke Rumah Pintar",
    description:
      "Jelajahi perkembangan teknologi rumah, dari cara hidup konvensional sampai rumah yang terhubung dan cerdas. Ucapkan perintah, lalu lihat lampu, tirai, dan suasana ruangan berubah: gambaran cara kita hidup bersama teknologi di masa depan.",
    minutes: "±20 menit",
    flow: ["Perangkat", "Terhubung", "Otomatis", "Dibantu AI", "Rumah pintar"],
    image: "/showroom/32.jpg",
  },
  {
    mood: "Ciptakan Karya",
    title: "Cetak 3D Sesuai Seleramu",
    description:
      "Dari dunia digital kembali ke dunia fisik. Kamu mengubah sebuah desain 3D sesuai seleramu, lalu melihat printer membangunnya lapis demi lapis sampai menjadi benda nyata yang bisa kamu pegang.",
    minutes: "±15 menit",
    flow: ["Ide", "Desain 3D", "Kustomisasi", "Cetak", "Benda nyata"],
    image: "/experience/print3d.jpg",
  },
  {
    mood: "Penutup",
    title: "Bawa pulang karyamu",
    description: "Ambil hasil cetak 3D-mu dan bawa pulang sebagai kenang-kenangan dari HOLOLABS.",
    minutes: "5 menit",
    flow: [],
    image: "",
  },
];

export interface VisitFact {
  value: string;
  label: string;
}

export const visitStats: VisitFact[] = [
  { value: "90'", label: "satu perjalanan utuh" },
  { value: "7", label: "babak pengalaman" },
  { value: "18", label: "kursi per pertunjukan" },
  { value: "Rp 100 rb", label: "per orang" },
];
