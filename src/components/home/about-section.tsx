import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
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
          <div className="holo-marquee-mask mt-12">
            <div className="holo-marquee flex w-max items-center gap-4 py-2">
              {[...bestWorks, ...bestWorks].map((work, index) => (
                <div
                  key={`${work.client}-${index}`}
                  className="flex h-20 w-40 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface p-4"
                >
                  <Image
                    src={work.logo}
                    alt={work.client}
                    width={120}
                    height={48}
                    className="h-auto max-h-10 w-auto max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
