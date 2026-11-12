import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getSiteContent } from "@/lib/cms";

/**
 * "About Us" — mirrors meatguysteakhouse.com's About Us, but leans into
 * personal branding: intro copy plus an actual portfolio ("Our Best
 * Works"), the same real client work shown on the Hololabs company-profile
 * site, instead of only descriptive prose.
 */
export async function AboutSection() {
  const { about, bestWorks } = await getSiteContent();
  const works = bestWorks.items.filter((work) => work.title || work.client);
  const logos = works.filter((work) => work.logo);

  return (
    <section id="about" className="py-8 sm:py-10">
      <Container className="max-w-3xl text-center">
        <Reveal>
          <Eyebrow className="justify-center">{about.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{about.title}</h2>
        </Reveal>
        <Reveal delay={100}>
          <span aria-hidden className="mx-auto mt-5 block h-px w-12 bg-accent" />
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-ink sm:text-xl sm:leading-9">{about.bodyShort}</p>
        </Reveal>
        <Reveal delay={220}>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-soft">{about.bodyLong}</p>
        </Reveal>
      </Container>

      <Container className="mt-16 sm:mt-20">
        <div className="text-center">
          <Reveal>
            <Eyebrow className="justify-center">{bestWorks.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <h3 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{bestWorks.title}</h3>
          </Reveal>
        </div>

        <ul className="mx-auto mt-8 grid max-w-5xl gap-x-12 sm:grid-cols-2">
          {works.map((work, index) => (
            <Reveal key={`${work.title}-${index}`} as="li" variant={index % 2 ? "right" : "left"} delay={(index % 6) * 50}>
              <div className="flex h-full flex-col gap-0.5 border-b border-line py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="text-sm leading-relaxed text-ink-soft sm:text-base">{work.title}</span>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-accent">{work.client}</span>
              </div>
            </Reveal>
          ))}
        </ul>

        {logos.length > 0 ? (
          <Reveal delay={200}>
            <div className="holo-marquee-mask mt-10 overflow-hidden">
              <div className="holo-marquee flex w-max items-center gap-4 py-2">
                {[...logos, ...logos].map((work, index) => (
                  <div
                    key={`${work.client}-${index}`}
                    className="flex h-28 w-56 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface p-5"
                  >
                    <Image
                      src={work.logo}
                      alt={work.client}
                      width={200}
                      height={80}
                      className="h-auto max-h-16 w-auto max-w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
