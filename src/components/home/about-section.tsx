import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { getSiteContent } from "@/lib/cms";

/**
 * "About Us" — mirrors meatguysteakhouse.com's About Us: a centered badge
 * row above centered intro copy. Folds in the substance of what used to be
 * separate Ambiance/Collection/Rundown sections as prose instead of
 * dedicated grids/timelines, matching the reference's narrative structure.
 */
export async function AboutSection() {
  const { about } = await getSiteContent();

  return (
    <section id="about" className="py-20 sm:py-28">
      <Container className="max-w-2xl text-center">
        <Reveal>
          <Eyebrow className="justify-center">{about.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">{about.title}</h2>
        </Reveal>

        {about.badges.length > 0 ? (
          <Reveal delay={120}>
            <dl className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {about.badges.map((badge, index) => (
                <div key={index} className="text-center">
                  <dd className="text-2xl text-ink">
                    <CountUp value={badge.value} />
                  </dd>
                  <dt className="mt-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    {badge.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        ) : null}

        <Reveal delay={180}>
          <p className="mt-8 text-sm leading-relaxed text-ink-soft sm:text-base">{about.bodyShort}</p>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft sm:text-base">{about.bodyLong}</p>
        </Reveal>
      </Container>
    </section>
  );
}
