/**
 * The 7-step show journey, per the client's WhatsApp revision (Badar Spero,
 * 7 Oct 2026, "Road map Milestone"). Each show runs ~1.5 hours end to end —
 * this replaced the original "just book a seat + F&B" framing from the
 * 16 Sept meeting notes with a guided, staged experience.
 */
export interface JourneyStep {
  title: string;
  description: string;
}

export const journeySteps: JourneyStep[] = [
  {
    title: "Booking kursi",
    description: "Pesan kursi dan paket F&B secara online, lalu datang sesuai jadwal show yang dipilih.",
  },
  {
    title: "Video mapping: Journey of Life",
    description: "Menonton pertunjukan projection mapping yang menceritakan perjalanan hidup.",
  },
  {
    title: "Pertunjukan interaktif + DJ",
    description: "Pengalaman interaktif dengan iringan musik langsung dari DJ.",
  },
  {
    title: "Ngobrol dengan AI avatar",
    description: "Berinteraksi dengan asisten virtual 3D berbasis AI (Doocoon AI).",
  },
  {
    title: "Menuju smart home",
    description: "Melihat langsung teknologi rumah pintar masa depan.",
  },
  {
    title: "Custom 3D printing",
    description: "Membawa pulang karya 3D cetak yang dipersonalisasi.",
  },
  {
    title: "Pulang",
    description: "Show selesai — pengalaman 1,5 jam yang lengkap dari awal sampai akhir.",
  },
];

export const journeyDurationLabel = "1,5 jam per show";
