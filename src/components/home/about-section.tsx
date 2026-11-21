import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { getSiteContent } from "@/lib/cms";

/**
 * "Apa itu Hololabs": the one-paragraph pitch on the left, the four
 * numbers that matter (length, chapters, seats, price) on the right.
 */
export async function AboutSection() {
  const { about, visit } = await getSiteContent();
  const stats = visit.stats.filter((s) => s.value);

  return (
    <section id="about" className="relative border-t border-line py-20 sm:py-28">
      <Container className="grid items-end gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24">
        <div>
          <Reveal>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-cyan">{"// "}{about.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-5 text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">{about.title}</h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-7 max-w-xl text-lg leading-9 text-ink-soft">{about.bodyShort}</p>
          </Reveal>
          {about.bodyLong ? (
            <Reveal delay={200}>
              <p className="mt-4 max-w-xl text-base leading-8 text-muted">{about.bodyLong}</p>
            </Reveal>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <Reveal delay={120}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {stats.map((stat, index) => (
                <div key={index} className="bg-canvas p-6 sm:p-8">
                  <dd className="whitespace-nowrap text-2xl text-ink sm:text-4xl">{stat.value}</dd>
                  <dt className="mt-2 font-mono text-[0.6875rem] uppercase leading-snug tracking-[0.12em] text-muted">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
