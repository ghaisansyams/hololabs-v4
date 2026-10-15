import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { AmbianceSection } from "@/components/home/ambiance-section";
import { CollectionSection } from "@/components/home/collection-section";
import { RundownSection } from "@/components/home/rundown-section";
import { OurStorySection } from "@/components/home/our-story-section";
import { ReservationCta } from "@/components/home/reservation-cta";
import { ContactSection } from "@/components/home/contact-section";
import { FaqSection } from "@/components/home/faq-section";
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
 * Single-page storytelling layout, styled after meatguysteakhouse.com:
 * Hero → Ambiance → Collection → Rundown → Our Story → Reservation CTA →
 * Contact → FAQ. Reservation itself is a dedicated screen at /pesan,
 * reached via the CTAs here — not embedded inline (v2's approach).
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
      <ReservationCta />
      <ContactSection />
      <FaqSection />
    </>
  );
}
