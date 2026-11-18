import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { buttonStyles } from "@/components/ui/button";
import { AmbianceRoom } from "@/components/home/ambiance-room";
import { AmbiancePhases } from "@/components/home/ambiance-phases";
import { getSiteContent } from "@/lib/cms";

/**
 * "Ambiance" page: introduces the venue and its atmosphere only (the
 * immersive content itself is Collection). Opening with a walk-in 3D room
 * and the key numbers, then the 90-minute visit as a scroll story, then
 * practical info and a way forward. Nothing here reuses the hero render;
 * the visuals are drawn in CSS/SVG until real venue photography exists.
 */
export async function AmbianceSection() {
  const { ambiance, navigation } = await getSiteContent();
  const phases = ambiance.phases.filter((p) => p.title);
  const facts = ambiance.facts.filter((f) => f.label && f.value);

  return (
    <>
      <section id="ambiance" className="relative overflow-x-clip pb-16 pt-10 sm:pb-24 sm:pt-16">
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow>{ambiance.eyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={70}>
              <h1 className="mt-4 text-[2.5rem] leading-[1.08] text-ink sm:text-5xl lg:text-6xl">{ambiance.title}</h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 max-w-lg text-base leading-8 text-ink-soft sm:text-lg">{ambiance.description}</p>
            </Reveal>

            {ambiance.stats.length > 0 ? (
              <Reveal delay={210}>
                <dl className="mt-10 grid grid-cols-3 border-t border-line pt-6">
                  {ambiance.stats.map((stat, index) => (
                    <div key={index} className={index > 0 ? "border-l border-line pl-4 sm:pl-6" : "pr-4"}>
                      <dd className="text-2xl text-ink sm:text-3xl">
                        <CountUp value={stat.value} />
                      </dd>
                      <dt className="mt-1.5 text-[0.6875rem] font-semibold uppercase leading-snug tracking-[0.12em] text-muted">
                        {stat.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ) : null}
          </div>

          <Reveal variant="zoom" delay={120}>
            <AmbianceRoom label="Ilustrasi tiga dimensi ruang Hololabs: lorong dengan dinding kaca, lantai reflektif, dan pintu bercahaya di ujungnya." />
          </Reveal>
        </Container>
      </section>

      {phases.length > 0 ? (
        <section className="border-t border-line py-16 sm:py-24" aria-label={ambiance.phasesTitle}>
          <AmbiancePhases eyebrow={ambiance.phasesEyebrow} title={ambiance.phasesTitle} phases={phases} />
        </section>
      ) : null}

      {facts.length > 0 ? (
        <section className="border-t border-line py-16 sm:py-24">
          <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <Reveal>
              <h2 className="text-3xl text-ink sm:text-4xl">{ambiance.factsTitle}</h2>
            </Reveal>
            <dl>
              {facts.map((fact, index) => (
                <Reveal key={index} delay={Math.min(index, 4) * 50}>
                  <div className="grid gap-1.5 border-t border-line py-5 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8">
                    <dt className="text-xs font-bold uppercase leading-7 tracking-[0.16em] text-accent">{fact.label}</dt>
                    <dd className="text-base leading-7 text-ink-soft">{fact.value}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-line py-16 sm:py-24">
        <Container className="text-center">
          <Reveal>
            <h2 className="mx-auto max-w-xl text-3xl text-ink sm:text-4xl">{ambiance.closingTitle}</h2>
          </Reveal>
          <Reveal delay={90}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/pesan" className={buttonStyles({ size: "lg" })}>
                {navigation.reservationLabel}
              </Link>
              <Link href="/collection" className={buttonStyles({ variant: "outline", size: "lg" })}>
                {ambiance.collectionLabel}
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
