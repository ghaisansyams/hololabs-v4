/**
 * The show timeline, matching the Experience Journey on the Hololabs company
 * profile (hololabs-web): six stages, ~90 minutes end to end. Supersedes the
 * earlier 7-step list from the client's WhatsApp revision (7 Oct 2026),
 * whose first step — booking — happens before the show and now lives in
 * the "Alurnya" section instead.
 */
export interface JourneyStep {
  title: string;
  subtitle: string;
  minutes: string;
  description: string;
}

export const journeySteps: JourneyStep[] = [
  {
    title: "Enter the Story",
    subtitle: "Journey of Life — Immersive Video Mapping",
    minutes: "15",
    description: "Experience dimulai melalui immersive video mapping yang membawa audience mengikuti sebuah visual story.",
  },
  {
    title: "Feel the Beat",
    subtitle: "Interactive DJ & Audio Reactive Performance",
    minutes: "15",
    description: "Musik menjadi trigger bagi visual. Audience tidak hanya menonton, mereka menjadi bagian dari performance.",
  },
  {
    title: "Meet AI",
    subtitle: "Doocoon AI — 3D Avatar Virtual Assistant",
    minutes: "15",
    description: "Pengunjung dapat berbicara langsung dengan 3D Avatar Virtual Assistant yang merespons audience.",
  },
  {
    title: "Road to Smart Living",
    subtitle: "Smart Home Technology Experience",
    minutes: "20",
    description: "Menjelajahi perkembangan teknologi rumah dari conventional living menuju connected dan intelligent living.",
  },
  {
    title: "Create Something",
    subtitle: "Custom 3D Printing Experience",
    minutes: "15",
    description: "Dari dunia digital kembali ke dunia fisik. Ide digital berubah menjadi benda nyata.",
  },
  {
    title: "Closing",
    subtitle: "Take the Experience Home",
    minutes: "10",
    description: "Go home with a new possibility.",
  },
];

export const journeyDurationLabel = "±90 menit per show";
