import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { DummyMapCard } from "@/components/home/dummy-map-card";

/**
 * "Lokasi" — replaces the homepage's live Jadwal grid, per the client's
 * request to follow meatguysteakhouse.com more closely: the reference's
 * homepage shows opening hours + a map, not a seat-availability grid
 * (that lives in the reservation flow itself, at /pesan). No address
 * exists yet, so the map is a dummy card (see DummyMapCard) that opens a
 * Google Maps search when clicked.
 */
export function LocationSection() {
  return (
    <section id="lokasi" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          stagger
          align="center"
          eyebrow="Lokasi"
          title="Temukan Hololabs"
          description="Alamat lengkap akan diumumkan menjelang hari show. Reservasi tetap bisa dilakukan sekarang — tanggal dan sesi dipilih saat reservasi."
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
