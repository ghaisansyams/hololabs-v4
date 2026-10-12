import { Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { JourneyTimeline } from "@/components/home/journey-timeline";
import { getSiteContent } from "@/lib/cms";

export async function JourneySection() {
  const { journey } = await getSiteContent();
  const total = journey.steps.reduce((sum, step) => sum + (Number.parseInt(step.minutes, 10) || 0), 0);

  return (
    <section id="timeline" className="relative overflow-hidden py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <Container>
        <SectionHeading
          stagger
          eyebrow={journey.eyebrow}
          title={
            <>
              {journey.title} <span className="text-gradient">{journey.titleAccent}</span>
            </>
          }
          description={journey.description}
          action={
            <Badge tone="accent" className="text-sm">
              <Clock className="size-3.5" aria-hidden />
              {journey.durationLabel}
            </Badge>
          }
        />

        {total > 0 ? (
          <Reveal variant="blur" delay={120}>
            <p className="mt-10 font-display text-2xl font-extrabold text-ink sm:text-3xl">
              <span className="tabular-nums">{total}</span> menit{" "}
              <span className="text-gradient">{journey.tagline}</span>
            </p>
          </Reveal>
        ) : null}

        <JourneyTimeline steps={journey.steps} />
      </Container>
    </section>
  );
}
