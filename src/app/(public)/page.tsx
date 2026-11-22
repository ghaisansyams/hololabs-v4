import type { Metadata } from "next";
import { ExperienceStage } from "@/components/home/experience-stage";
import { HeroSection } from "@/components/home/hero-section";
import { VisitSection } from "@/components/home/visit-section";
import { AboutSection } from "@/components/home/about-section";
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
 * Homepage: a full-screen photo hero, then the 3D scroll journey (the seven
 * chapters of the show),
 * then what Hololabs is, how to reserve, and FAQ. The founder/team block
 * (PeopleSection, still editable in the CMS) is left off until real bios exist.
 * Reservation itself lives at /booking (same flow as hololabs.id/booking).
 */
export default async function HomePage() {
  const { brand, experience } = await getSiteContent();
  const steps = experience.steps.filter((step) => step.title);
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
      <HeroSection />
      <ExperienceStage steps={steps} />
      <AboutSection />
      <VisitSection />
      <FaqSection />
    </>
  );
}
