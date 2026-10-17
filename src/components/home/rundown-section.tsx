import { Clock, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/ui/tilt-card";
import { JourneyTimeline } from "@/components/home/journey-timeline";
import { getSiteContent } from "@/lib/cms";

/** Not a real address yet (see the FAQ: "Alamat venue akan diumumkan"), so
 * this just opens a generic Google Maps search rather than linking to a
 * specific place. */
const DUMMY_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Hololabs+Jakarta";

/**
 * "Rundown" — deliberately not called "Menu" (per the revision notes):
 * the alur cerita (story beats of one show), on its own dedicated page
 * (reached from the header menu). Jadwal (the live show schedule) stays on
 * the homepage, so it isn't shown twice.
 */
export async function RundownSection() {
  const { rundown } = await getSiteContent();
  const total = rundown.steps.reduce((sum, step) => sum + (Number.parseInt(step.minutes, 10) || 0), 0);

  return (
    <section id="rundown" className="relative overflow-hidden py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <Container>
        <SectionHeading
          stagger
          eyebrow={rundown.eyebrow}
          title={
            <>
              {rundown.title} <span className="text-gradient">{rundown.titleAccent}</span>
            </>
          }
          description={rundown.description}
          action={
            <Badge tone="accent" className="text-sm">
              <Clock className="size-3.5" aria-hidden />
              {rundown.durationLabel}
            </Badge>
          }
        />

        <Reveal variant="blur" delay={120}>
          <p className="mt-10 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {total > 0 ? <span className="tabular-nums">{total} menit </span> : null}
            <span className="text-gradient">{rundown.tagline}</span>
          </p>
        </Reveal>

        <JourneyTimeline steps={rundown.steps} />

        <Reveal variant="zoom" delay={160}>
          <a
            href={DUMMY_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-14 block"
            aria-label="Buka lokasi Hololabs di Google Maps"
          >
            <TiltCard max={4}>
              <div className="group relative overflow-hidden rounded-card border border-line">
                {/* Dummy map — lokasi belum final (lihat FAQ), jadi ini
                    bukan peta sungguhan, cuma pola visual yang mengarahkan
                    ke pencarian Google Maps saat diklik. */}
                <div
                  aria-hidden
                  className="relative flex h-56 items-center justify-center overflow-hidden bg-canvas-deep sm:h-72"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-accent/10" />
                  <span className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-canvas shadow-glow transition-transform duration-300 group-hover:scale-110">
                    <MapPin className="size-6" aria-hidden />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-line bg-surface p-5">
                  <div>
                    <p className="text-sm font-bold text-ink">Lokasi venue (sementara)</p>
                    <p className="mt-0.5 text-xs text-muted">Alamat lengkap akan diumumkan menjelang hari show.</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-accent transition-colors group-hover:text-ink">
                    Buka di Google Maps
                  </span>
                </div>
              </div>
            </TiltCard>
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
