import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { howItWorks } from "@/data/site";

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Alurnya" title="Empat langkah, tanpa antre" />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step, index) => (
            <Reveal key={step.title} delay={index * 70} className="relative">
              <div className="h-full rounded-card border border-line bg-surface p-6">
                <span className="text-4xl font-extrabold text-line font-display">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-base font-extrabold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
              {index < howItWorks.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-2.5 hidden h-px w-5 -translate-y-1/2 bg-gradient-to-r from-brand to-accent lg:block"
                />
              ) : null}
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
