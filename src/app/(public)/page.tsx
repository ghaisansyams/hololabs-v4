import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { AmbianceSection } from "@/components/home/ambiance-section";
import { CollectionSection } from "@/components/home/collection-section";
import { RundownSection } from "@/components/home/rundown-section";
import { OurStorySection } from "@/components/home/our-story-section";
import { ReservationSection } from "@/components/home/reservation-section";
import { siteConfig } from "@/data/site";

// Rendered per request: content comes from the CMS and seat counts from
// the live schedule, so a build-time snapshot would be stale immediately.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

/**
 * Single-page storytelling layout, per the Oct 2026 revision notes
 * (reference: meatguysteakhouse.com — experience-first, full story on one
 * page, ending in a simple reservation flow): Hero → Ambiance → Collection
 * → Rundown → Our Story → Reservasi.
 */
export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    organizer: { "@type": "Organization", name: "Hololabs" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <AmbianceSection />
      <CollectionSection />
      <RundownSection />
      <OurStorySection />
      <ReservationSection />
    </>
  );
}
