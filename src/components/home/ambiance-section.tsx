import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getSiteContent } from "@/lib/cms";

/**
 * "Ambiance" — introduces the venue and its atmosphere only, not the
 * immersive content itself (that's Collection, right after). Styled after
 * meatguysteakhouse.com's "About Us": a centered badge row, centered copy,
 * then a full-width photographic strip. Per the revision notes: real venue
 * photography isn't ready yet, so this reuses a render from the Hololabs
 * company profile as a stand-in visual.
 */
export async function AmbianceSection() {
  const { ambiance } = await getSiteContent();

  return (
    <section id="ambiance" className="py-20 sm:py-28">
      <Container className="max-w-3xl text-center">
        <Reveal>
          <Eyebrow className="justify-center">{ambiance.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={70}>
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">{ambiance.title}</h2>
        </Reveal>

        {ambiance.stats.length > 0 ? (
          <Reveal delay={130}>
            <dl className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {ambiance.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <dd className="text-2xl text-ink">{stat.value}</dd>
                  <dt className="mt-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        ) : null}

        <Reveal delay={190}>
          <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
            {ambiance.description}
          </p>
        </Reveal>
      </Container>

      <Reveal delay={240}>
        <div className="relative mx-auto mt-14 h-72 max-w-5xl overflow-hidden rounded-card border border-line sm:h-[28rem]">
          <Image
            src="/renders/ambiance-hall.jpg"
            alt="Render suasana ruang Hololabs — koridor imersif dengan dinding LED"
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas-deep/60 via-transparent to-transparent" />
          <p className="absolute bottom-4 left-4 text-xs font-medium text-ink-soft/80">
            Ilustrasi render — belum foto venue asli.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
