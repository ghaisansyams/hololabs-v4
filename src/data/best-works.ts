/**
 * Real client work, carried over from the Hololabs company-profile site
 * (hololabs-web) so the "About Us" section can show an actual portfolio
 * instead of only descriptive copy.
 */
export interface BestWork {
  title: string;
  client: string;
  logo: string;
}

export const bestWorks: BestWork[] = [
  { title: "Planetarium Dome Projection & Content", client: "Planetarium Jakarta", logo: "/works/planetarium.png" },
  { title: "Virtual DJ Gear & Car Projection Mapping", client: "Mercedes-Benz", logo: "/works/mercedes.png" },
  { title: "Soekarno-Hatta Int'l Airport FIDS & Wayfinding", client: "Angkasa Pura II", logo: "/works/angkasa-pura.png" },
  { title: "All-New Kia Picanto Car Projection Mapping", client: "KIA", logo: "/works/kia.png" },
  { title: "Stage Mapping at IBM Launch Event", client: "IBM", logo: "/works/ibm.png" },
  { title: "Animation & Projection Mapping for Brand Activation", client: "Aqua", logo: "/works/aqua.png" },
  { title: "VR Driving Simulator at GIIAS", client: "Daihatsu & Honda", logo: "/works/honda.png" },
  { title: "Customer Experience Interactive Room", client: "Nestlé", logo: "/works/nestle.png" },
  { title: "Interactive Exhibition Installation", client: "Tropenmuseum Netherlands", logo: "/works/tropenmuseum.png" },
];
