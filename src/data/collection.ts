/**
 * "Collection" — per the revision notes, this is where Hololabs' 3D work
 * and immersive content (audio, reaction stage, avatar zone, etc.) lives,
 * as opposed to Ambiance (venue/mood only). Content follows the company
 * profile's "One Lab. Multiple Possibilities." eight areas.
 */
export type CollectionIcon = "projector" | "monitor" | "gamepad" | "bot" | "glasses" | "printer" | "home" | "disc";

export interface CollectionItem {
  no: string;
  title: string;
  tagline: string;
  description: string;
  icon: CollectionIcon;
  highlights: string[];
}

export const collectionItems: CollectionItem[] = [
  {
    no: "01",
    title: "Projection",
    tagline: "Turn any surface into a story.",
    description: "Mengubah ruang, bangunan, object, stage, maupun permukaan apa pun jadi medium visual storytelling yang imersif dan interaktif.",
    icon: "projector",
    highlights: ["Projection mapping", "Immersive projection", "Interactive projection", "AV performance"],
  },
  {
    no: "02",
    title: "Display",
    tagline: "More than a screen.",
    description: "Digital signage, interactive kiosk, LED display, hingga Holobox — platform visual yang mengajak audience masuk dan berinteraksi.",
    icon: "monitor",
    highlights: ["Digital signage", "Interactive kiosk", "LED display", "Holobox"],
  },
  {
    no: "03",
    title: "Game & Simulation",
    tagline: "Don't just watch. Play.",
    description: "Holo-Wall interactive games, gesture-based Holo-X, hingga simulation experience — audience jadi bagian dari pengalamannya.",
    icon: "gamepad",
    highlights: ["Holo-Wall games", "Holo-X gesture", "Simulation experience"],
  },
  {
    no: "04",
    title: "AI Solutions",
    tagline: "Intelligence that works with you.",
    description: "Doocoon AI — 3D avatar virtual assistant yang bisa diajak bicara dan merespons langsung, plus AI photobooth untuk momen personal.",
    icon: "bot",
    highlights: ["3D AI avatar", "AI photobooth", "Agentic AI"],
  },
  {
    no: "05",
    title: "VR Solutions",
    tagline: "Step into another reality.",
    description: "VR games dan VR experience dalam virtual environment penuh, untuk entertainment maupun eksplorasi dunia lain.",
    icon: "glasses",
    highlights: ["VR games", "VR experience", "Virtual environment"],
  },
  {
    no: "06",
    title: "3D Printing & Custom",
    tagline: "From digital idea to physical form.",
    description: "Dari dunia digital kembali ke dunia fisik — custom 3D design yang dicetak jadi karya nyata untuk dibawa pulang.",
    icon: "printer",
    highlights: ["3D printed object", "Custom design", "Digital fabrication"],
  },
  {
    no: "07",
    title: "Smart Home & Office",
    tagline: "From smart space to intelligent space.",
    description: "AI avatar sebagai interface rumah dan kantor pintar — dari conventional living menuju connected, intelligent living.",
    icon: "home",
    highlights: ["Smart home AI avatar", "Smart office AI avatar", "Connected living"],
  },
  {
    no: "08",
    title: "DJ / VJ Audio Reactive",
    tagline: "See the music. Feel the visual.",
    description: "Musik jadi trigger bagi visual — DJ performance dengan projection, lighting, dan interactive content yang merespons real-time.",
    icon: "disc",
    highlights: ["DJ performance", "Audio reactive visual", "Live interaction"],
  },
];
