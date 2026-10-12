import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSiteContent } from "@/lib/cms";

export async function HowItWorks() {
  const { howItWorks } = await getSiteContent();
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={howItWorks.eyebrow} title={howItWorks.title} />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step, index) => (
            <Reveal key={index} variant="zoom" delay={index * 90} className="relative">
              <div className="h-full rounded-card border border-line bg-surface p-6">
                <span className="text-4xl font-extrabold text-line font-display">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-base font-extrabold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
              {index < howItWorks.steps.length - 1 ? (
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
