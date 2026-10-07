import { Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { TiltCard } from "@/components/ui/tilt-card";
import { journeyDurationLabel, journeySteps } from "@/data/journey";

export function JourneySection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Rundown show"
          title="Satu show, tujuh tahap pengalaman"
          description="Dari duduk sampai pulang, seluruh rangkaian berjalan dalam satu show berdurasi 1,5 jam."
          action={
            <Badge tone="accent" className="text-sm">
              <Clock className="size-3.5" aria-hidden />
              {journeyDurationLabel}
            </Badge>
          }
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 60}>
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
