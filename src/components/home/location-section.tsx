import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { DummyMapCard } from "@/components/home/dummy-map-card";
import { getSiteContent } from "@/lib/cms";

/**
 * "Lokasi" — replaces the homepage's live Jadwal grid, per the client's
 * request to follow meatguysteakhouse.com more closely: the reference's
 * homepage shows opening hours + a map, not a seat-availability grid
 * (that lives in the reservation flow itself, at /pesan). The map card
 * (see DummyMapCard) opens the client's real Google Maps location.
 */
export async function LocationSection() {
  const { location } = await getSiteContent();
  return (
    <section id="lokasi" className="pb-0 pt-8 sm:pt-10">
      <Container>
        <SectionHeading
          stagger
          align="center"
          eyebrow={location.eyebrow}
          title={location.title}
          description={location.description}
          className="mx-auto max-w-2xl"
        />

        <Reveal variant="zoom" delay={120}>
          <div className="mx-auto mt-10 max-w-3xl">
            <DummyMapCard />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
