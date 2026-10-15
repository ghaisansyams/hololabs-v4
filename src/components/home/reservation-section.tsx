import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getSiteContent } from "@/lib/cms";
import { groupByDay, listAvailability, listPackages } from "@/lib/services/availability";

/**
 * "Reservasi" — the page's one call to action, per the revision notes:
 * pilih tanggal → pilih sesi → isi data → pembayaran, tanpa langkah
 * berlebihan, right at the end of the single-page story. Embeds the same
 * BookingWizard /pesan uses, so there's exactly one booking engine.
 */
export async function ReservationSection() {
  const [{ reservation }, sessions, packages] = await Promise.all([
    getSiteContent(),
    listAvailability(),
    listPackages(),
  ]);
  const schedule = groupByDay(sessions);

  return (
    <section id="reservasi" className="py-16 sm:py-24">
      <Container>
        <SectionHeading align="center" eyebrow={reservation.eyebrow} title={reservation.title} description={reservation.description} />

        {reservation.steps.length > 0 ? (
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reservation.steps.map((step, index) => (
              <Reveal key={index} variant="up" delay={index * 60}>
                <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface p-4">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-canvas">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{step.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}

        <div className="mt-12">
          <BookingWizard schedule={schedule} packages={packages} />
        </div>
      </Container>
    </section>
  );
}
