import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { TiltCard } from "@/components/ui/tilt-card";
import { bestWorks } from "@/data/best-works";
import { getSiteContent } from "@/lib/cms";

/**
 * "About Us" — mirrors meatguysteakhouse.com's About Us, but leans into
 * personal branding: intro copy plus an actual portfolio ("Our Best
 * Works"), the same real client work shown on the Hololabs company-profile
 * site, instead of only descriptive prose.
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

      <Container className="mt-20 sm:mt-28">
        <div className="text-center">
          <Reveal>
            <Eyebrow className="justify-center">Our Best Works</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <h3 className="mt-4 text-2xl text-ink sm:text-3xl">Proyek yang sudah kami kerjakan</h3>
          </Reveal>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-x-10 gap-y-3 sm:grid-cols-2">
          {bestWorks.map((work, index) => (
            <Reveal key={work.title} variant={index % 2 ? "right" : "left"} delay={(index % 6) * 50}>
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  {work.title} <span className="italic text-muted">({work.client})</span>
                </span>
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-5">
            {bestWorks.map((work) => (
              <TiltCard key={work.client} max={6}>
                <div className="flex h-20 items-center justify-center rounded-2xl border border-line bg-surface p-4 grayscale transition-all duration-300 hover:grayscale-0">
                  <Image
                    src={work.logo}
                    alt={work.client}
                    width={120}
                    height={48}
                    className="h-auto max-h-10 w-auto max-w-full object-contain"
                  />
                </div>
              </TiltCard>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
