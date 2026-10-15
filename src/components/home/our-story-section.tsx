import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TiltCard } from "@/components/ui/tilt-card";
import { getSiteContent } from "@/lib/cms";

/**
 * "Our Story" — per the revision notes, this content is still being
 * finalized by the content team; what's here is the current working
 * draft from the company profile, editable from the CMS like every other
 * section so it can be swapped the moment the final copy lands.
 */
export async function OurStorySection() {
  const { ourStory } = await getSiteContent();

  return (
    <section id="our-story" className="py-16 sm:py-24">
      <Container>
        <SectionHeading stagger eyebrow={ourStory.eyebrow} title={ourStory.statement} description={ourStory.lead} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal variant="zoom">
            <TiltCard max={6}>
              <div className="relative overflow-hidden rounded-card border border-line bg-white p-8 sm:p-10">
                <Image
                  src="/renders/story-glass-logo.jpg"
                  alt="Logo Hololabs dalam bentuk kaca 3D, simbol pertemuan dunia fisik dan digital"
                  width={900}
                  height={650}
                  className="h-auto w-full"
                  priority={false}
                />
              </div>
            </TiltCard>
          </Reveal>

          <Reveal variant="right" delay={80}>
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
              <p className="text-lg font-bold leading-snug text-ink sm:text-xl">“{ourStory.philosophyQuote}”</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{ourStory.philosophyBody}</p>
            </div>
          </Reveal>
        </div>

        {ourStory.traits.length > 0 ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ourStory.traits.map((trait, index) => (
              <Reveal key={index} variant="blur" delay={index * 70}>
                <div className="h-full rounded-2xl border border-line bg-surface p-4">
                  <h3 className="text-sm font-extrabold text-gradient">{trait.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{trait.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}

        {ourStory.manifesto.length > 0 ? (
          <Reveal variant="blur" delay={160}>
            <div className="mt-12 rounded-card border border-line bg-canvas-deep px-6 py-10 text-center sm:px-10">
              {ourStory.manifesto.map((line, index) => (
                <p
                  key={index}
                  className={
                    index === ourStory.manifesto.length - 1
                      ? "mt-3 text-sm font-semibold text-ink-soft sm:text-base"
                      : "text-lg font-bold text-ink sm:text-xl"
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
