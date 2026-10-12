import type { Metadata } from "next";
import { CtaBanner } from "@/components/home/cta-banner";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { JourneySection } from "@/components/home/journey-section";
import { PackagesSection } from "@/components/home/packages-section";
import { ScheduleSection } from "@/components/home/schedule-section";
import { ServicesSection } from "@/components/home/services-section";
import { ValueProps } from "@/components/home/value-props";
import { siteConfig } from "@/data/site";

// Rendered per request: content comes from the CMS and seat counts from
// the live schedule, so a build-time snapshot would be stale immediately.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

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
      <ValueProps />
      <JourneySection />
      <ScheduleSection />
      <PackagesSection />
      <ServicesSection />
      <HowItWorks />
      <CtaBanner />
    </>
  );
}
