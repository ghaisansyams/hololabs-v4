import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Container } from "@/components/ui/container";

/**
 * A standalone reservation call-to-action, between Our Story and the
 * contact block — mirrors meatguysteakhouse.com's bordered "RESERVATION"
 * button section. Links to the dedicated /pesan reservation screen.
 */
export function ReservationCta() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="flex justify-center">
        <Reveal variant="zoom">
          <Link
            href="/pesan"
            className="inline-flex items-center justify-center rounded-pill border border-accent/60 px-12 py-5 text-sm font-semibold uppercase tracking-[0.22em] text-accent transition-colors hover:bg-accent-soft"
          >
            Reservasi
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
