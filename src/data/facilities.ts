/**
 * What a visitor actually finds inside Hololabs — one zone per stage of the
 * show, plus the F&B lounge. Drawn from the Hololabs service lines (sent by
 * the client, 7 Oct 2026) and the Experience Journey (data/journey.ts).
 */
export type FacilityIcon = "projector" | "disc" | "bot" | "home" | "printer" | "gamepad" | "monitor" | "coffee";

export interface Facility {
  title: string;
  icon: FacilityIcon;
  description: string;
  highlights: string[];
}

export const facilities: Facility[] = [
  {
    title: "Immersive Projection Room",
    icon: "projector",
    description:
      "Ruang utama show: dinding dan lantai berubah jadi layar lewat projection mapping untuk visual story Journey of Life.",
    highlights: ["Projection mapping", "Immersive", "Interactive projection", "AV performance"],
  },
  {
    title: "Audio Reactive Stage",
    icon: "disc",
    description: "Panggung DJ & VJ — setiap beat musik menggerakkan visual di sekelilingmu secara real-time.",
    highlights: ["DJ music performance", "Audio reactive interactive performance"],
  },
  {
    title: "AI Avatar Zone",
    icon: "bot",
    description: "Ngobrol langsung dengan Doocoon AI, asisten virtual 3D yang menjawab dan merespons pengunjung.",
    highlights: ["AI photobooth", "Agentic AI admin", "Agentic AI finance", "Agentic AI legal compliance", "Agentic AI marketing", "Agentic AI customer support"],
  },
  {
    title: "Smart Living Showroom",
    icon: "home",
    description: "Rumah dan kantor pintar yang bisa dicoba: dari conventional living menuju connected living.",
    highlights: ["Smart home AI avatar", "Smart office AI avatar"],
  },
  {
    title: "3D Printing Lab",
    icon: "printer",
    description: "Lihat ide digital dicetak jadi benda nyata — dan bawa pulang karya custom-mu.",
    highlights: ["Shoes 3D printing", "Action figure", "Custom 3D design"],
  },
  {
    title: "Holo Game Arena",
    icon: "gamepad",
    description: "Area main interaktif dengan holo-wall dan kontrol gerakan tubuh, tanpa stik.",
    highlights: ["Holo-wall interactive games", "Holo-x gesture games", "Educational games", "Simulation experiences", "Custom games & activations"],
  },
  {
    title: "Interactive Display",
    icon: "monitor",
    description: "Holobox, layar LED, dan kiosk interaktif yang menampilkan konten 3D di sepanjang jalur pameran.",
    highlights: ["Digital signage", "Interactive kiosk", "Immersive & interactive display", "LED displays", "Holobox", "Interactive content"],
  },
  {
    title: "F&B Lounge",
    icon: "coffee",
    description: "Kursi tereservasi dengan sajian makanan & minuman sesuai paket F&B yang kamu pilih.",
    highlights: ["Kursi tereservasi", "Dimsum & camilan", "Minuman"],
  },
];
