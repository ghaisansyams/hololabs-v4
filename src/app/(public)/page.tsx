import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { AboutSection } from "@/components/home/about-section";
import { PeopleSection } from "@/components/home/people-section";
import { ScheduleSection } from "@/components/home/schedule-section";
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
 * Homepage structure mirrors meatguysteakhouse.com exactly, per the
 * client's request: Hero → About Us → Founder profile → second profile →
 * Jadwal (hours equivalent) → standalone Reservation CTA → Contact → FAQ →
 * Footer. Reservation itself still lives at /pesan, unchanged from v3.
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
      <AboutSection />
      <PeopleSection />
      <ScheduleSection />
      <ReservationCta />
      <ContactSection />
      <FaqSection />
    </>
  );
}
