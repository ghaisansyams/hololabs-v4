import type { Metadata } from "next";
import { CtaBanner } from "@/components/home/cta-banner";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { PackagesSection } from "@/components/home/packages-section";
import { ScheduleSection } from "@/components/home/schedule-section";
import { ValueProps } from "@/components/home/value-props";
import { siteConfig } from "@/data/site";

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
    organizer: { "@type": "Organization", name: "Holomoc" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <ValueProps />
      <ScheduleSection />
      <PackagesSection />
      <HowItWorks />
      <CtaBanner />
    </>
  );
}
