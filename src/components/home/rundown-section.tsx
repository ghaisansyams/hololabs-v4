import { Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { JourneyTimeline } from "@/components/home/journey-timeline";
import { getSiteContent } from "@/lib/cms";

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
      </Container>
    </section>
  );
}
