import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSiteContent } from "@/lib/cms";

/**
 * "Ambiance" — introduces the venue and its atmosphere only, not the
 * immersive content itself (that's Collection, right after). Per the
 * revision notes: real venue photography isn't ready yet, so this uses a
 * render from the Hololabs company profile as a stand-in visual.
 */
export async function AmbianceSection() {
  const { ambiance } = await getSiteContent();

  return (
    <section id="ambiance" className="py-16 sm:py-24">
      <Container>
        <SectionHeading stagger eyebrow={ambiance.eyebrow} title={ambiance.title} description={ambiance.description} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <Reveal variant="left">
            <div className="relative h-72 overflow-hidden rounded-card border border-line sm:h-96 lg:h-full">
              <Image
                src="/renders/ambiance-hall.jpg"
                alt="Render suasana ruang Hololabs — koridor imersif dengan dinding LED"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
                priority={false}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/10 to-transparent"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-canvas/70 via-transparent to-transparent"
              />
              <p className="absolute bottom-4 left-4 right-4 text-xs font-medium text-ink-soft/80">
                Ilustrasi render — belum foto venue asli.
              </p>
            </div>
          </Reveal>

          <Reveal variant="right" delay={80}>
            <div className="flex h-full flex-col justify-between gap-6 rounded-card border border-line bg-surface p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-muted">
                Sebuah ruang yang transparan, berlapis, dan terus bergerak — simbol dari pertemuan dunia fisik dan
                digital. Di sinilah perjalananmu dimulai, sebelum masuk ke setiap zona teknologinya.
              </p>
              {ambiance.stats.length > 0 ? (
                <dl className="grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3 lg:grid-cols-1">
                  {ambiance.stats.map((stat, index) => (
                    <div key={index} className="flex items-baseline justify-between gap-3 sm:flex-col sm:items-start lg:flex-row lg:items-baseline">
                      <dd className="text-2xl font-extrabold text-ink font-display">{stat.value}</dd>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
