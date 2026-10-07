/**
 * Hololabs's business lines, as sent by the client (Badar Spero, WhatsApp,
 * 7 Oct 2026: "Storytelling. Dari holomoc.com") — context for who Hololabs
 * is, shown on the landing page to back the exhibition with the company's
 * actual technology capabilities rather than presenting it as a one-off
 * event.
 */
export type ServiceIcon = "projector" | "monitor" | "gamepad" | "bot" | "glasses" | "printer" | "home" | "disc";

export interface ServiceCategory {
  title: string;
  icon: ServiceIcon;
  items: string[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    title: "Projection",
    icon: "projector",
    items: ["Projection mapping", "Immersive", "Interactive projection", "AV performance"],
  },
  {
    title: "Display",
    icon: "monitor",
    items: [
      "Digital signage",
      "Interactive kiosk",
      "Immersive & interactive display",
      "LED displays",
      "Holobox",
      "Interactive content",
    ],
  },
  {
    title: "Game & Simulation",
    icon: "gamepad",
    items: [
      "Holo-wall interactive games",
      "Holo-X gesture games",
      "Educational games",
      "Simulation experiences",
      "Custom games & activations",
    ],
  },
  {
    title: "AI Solutions",
    icon: "bot",
    items: [
      "AI photobooth",
      "Agentic AI admin",
      "Agentic AI finance",
      "Agentic AI legal compliance",
      "Agentic AI marketing",
      "Agentic AI customer support",
    ],
  },
  {
    title: "VR Solution",
    icon: "glasses",
    items: ["VR games", "VR experience", "VR for education"],
  },
  {
    title: "3D Printing Custom",
    icon: "printer",
    items: ["Shoes 3D printing", "Action figure", "Custom 3D design"],
  },
  {
    title: "Smart Home / Office",
    icon: "home",
    items: ["Smart home AI avatar", "Smart office AI avatar"],
  },
  {
    title: "DJ / VJ Audio Reactive",
    icon: "disc",
    items: ["DJ music performance", "Audio reactive interactive performance"],
  },
];
