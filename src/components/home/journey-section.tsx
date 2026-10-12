import { Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/ui/tilt-card";
import { getSiteContent } from "@/lib/cms";

export async function JourneySection() {
  const { journey } = await getSiteContent();
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow={journey.eyebrow}
          title={journey.title}
          description={journey.description}
          action={
            <Badge tone="accent" className="text-sm">
              <Clock className="size-3.5" aria-hidden />
              {journey.durationLabel}
            </Badge>
          }
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journey.steps.map((step, index) => (
            <Reveal key={index} delay={index * 60}>
              <li className="h-full">
                <TiltCard className="h-full" max={8}>
                  <div className="h-full rounded-card border border-line bg-surface p-5">
                    <span className="inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-bold text-canvas font-display shadow-glow">
                      {index + 1}
                    </span>
                    <h3 className="mt-4 text-sm font-extrabold text-ink">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.description}</p>
                  </div>
                </TiltCard>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
