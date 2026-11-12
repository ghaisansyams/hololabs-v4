import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { AboutSection } from "@/components/home/about-section";
import { PeopleSection } from "@/components/home/people-section";
import { LocationSection } from "@/components/home/location-section";
import { ReservationCta } from "@/components/home/reservation-cta";
import { ContactSection } from "@/components/home/contact-section";
import { FaqSection } from "@/components/home/faq-section";
import { siteConfig } from "@/data/site";
import { getSiteContent } from "@/lib/cms";

// Rendered per request: content comes from the CMS and seat counts from
// the live schedule, so a build-time snapshot would be stale immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getSiteContent();
  return {
    title: { absolute: brand.seoTitle },
    description: brand.seoDescription,
    alternates: { canonical: "/" },
  };
}

/**
 * Homepage structure mirrors meatguysteakhouse.com exactly, per the
 * client's request: Hero → About Us → Founder profile → second profile →
 * Lokasi (hours/map equivalent) → standalone Reservation CTA → Contact →
 * FAQ → Footer. Reservation itself still lives at /pesan, unchanged from
 * v3 — Lokasi replaced the earlier live Jadwal grid, which duplicated what
 * the reservation flow already shows.
 */
export default async function HomePage() {
  const { brand } = await getSiteContent();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: brand.siteName,
    description: brand.seoDescription,
    url: siteConfig.url,
    organizer: { "@type": "Organization", name: brand.siteName },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <AboutSection />
      <PeopleSection />
      <LocationSection />
      <ReservationCta />
      <ContactSection />
      <FaqSection />
    </>
  );
}
