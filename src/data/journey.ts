/**
 * The show roadmap, per the client's WhatsApp "Road map Milestone"
 * (Badar Spero, Oct 2026): seven stages, 1,5 jam per show. The client gave
 * no per-stage durations, so `minutes` stays empty and the timeline simply
 * omits the duration pill.
 */
export interface JourneyStep {
  title: string;
  subtitle: string;
  minutes: string;
  description: string;
}

export const journeySteps: JourneyStep[] = [
  {
    title: "Booking seat",
    subtitle: "Reservasi sebelum datang",
    minutes: "",
    description: "Pilih jadwal show, reservasi seat, dan bersiap memasuki Hololabs.",
  },
  {
    title: "Nonton video mapping",
    subtitle: "Journey of Life",
    minutes: "",
    description: "Menonton video mapping yang bercerita tentang journey of life — visual, projection, dan audio jadi satu opening experience.",
  },
  {
    title: "Interactive performance",
    subtitle: "With DJ backsound",
    minutes: "",
    description: "Pertunjukan interaktif dengan iringan DJ — audience tidak hanya menonton, mereka jadi bagian dari performance.",
  },
  {
    title: "Chit chat dengan AI",
    subtitle: "3D Avatar Virtual Assistant — Doocoon AI",
    minutes: "",
    description: "Ngobrol langsung dengan Doocoon AI, 3D avatar virtual assistant yang bisa berkomunikasi dan merespons audience.",
  },
  {
    title: "Road to smart home technology",
    subtitle: "Smart home experience",
    minutes: "",
    description: "Menjelajahi perjalanan teknologi rumah dari conventional living menuju connected dan intelligent living.",
  },
  {
    title: "Custom 3D printing",
    subtitle: "From digital idea to physical form",
    minutes: "",
    description: "Dari dunia digital kembali ke dunia fisik — lihat ide jadi benda nyata lewat custom 3D printing.",
  },
  {
    title: "Pulang",
    subtitle: "Take the experience home",
    minutes: "",
    description: "Show selesai — pulang membawa pengalaman 1,5 jam dan kemungkinan baru.",
  },
];

export const journeyDurationLabel = "1,5 jam per show";
