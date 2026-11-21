import type { Metadata } from "next";
import { ExperienceStage } from "@/components/home/experience-stage";
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
 * Homepage: a 3D scroll journey (hero + the seven chapters of the show),
 * then what Hololabs is, how to reserve, and FAQ. The founder/team block
 * (PeopleSection, still editable in the CMS) is left off until real bios exist.
 * Reservation itself still lives at /pesan.
 */
export default async function HomePage() {
  const { brand, hero, experience, visit } = await getSiteContent();
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
      <ExperienceStage hero={{ ...hero, hud: visit.stats.filter((item) => item.value) }} steps={steps} />
      <AboutSection />
      <VisitSection />
      <FaqSection />
    </>
  );
}
