/**
 * Holomoc's business lines, as sent by the client (Badar Spero, WhatsApp,
 * 7 Oct 2026: "Storytelling. Dari holomoc.com") — context for who Holomoc
 * is, shown on the landing page to back the exhibition with the company's
 * actual technology capabilities rather than presenting it as a one-off
 * event.
 */
export interface ServiceCategory {
  title: string;
  items: string[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    title: "Projection",
    items: ["Projection mapping", "Immersive", "Interactive projection", "AV performance"],
  },
  {
    title: "Display",
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
    items: ["VR games", "VR experience", "VR for education"],
  },
  {
    title: "3D Printing Custom",
    items: ["Shoes 3D printing", "Action figure", "Custom 3D design"],
  },
  {
    title: "Smart Home / Office",
    items: ["Smart home AI avatar", "Smart office AI avatar"],
  },
  {
    title: "DJ / VJ Audio Reactive",
    items: ["DJ music performance", "Audio reactive interactive performance"],
  },
];
