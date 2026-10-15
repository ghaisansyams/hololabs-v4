import { Bot, Disc3, Gamepad2, Glasses, Home, Monitor, Printer, Projector, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TiltCard } from "@/components/ui/tilt-card";
import { collectionItems, type CollectionIcon } from "@/data/collection";
import { getSiteContent } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

const icons: Record<CollectionIcon, LucideIcon> = {
  projector: Projector,
  monitor: Monitor,
  gamepad: Gamepad2,
  bot: Bot,
  glasses: Glasses,
  printer: Printer,
  home: Home,
  disc: Disc3,
};

/**
 * "Collection" — Hololabs' 3D work and immersive content (per the
 * revision notes: audio, reaction stage, avatar zone, etc.), as opposed to
 * Ambiance (venue/mood only). No real render photography per card yet, so
 * each tile carries a dummy "3D" visual — spinning orbit rings behind the
 * icon — rather than a photo.
 */
export async function CollectionSection() {
  const { collection } = await getSiteContent();
  const list = collection.items;

  return (
    <section id="collection" className="relative overflow-hidden py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 -z-10 size-[32rem] -translate-y-1/3 translate-x-1/4 rounded-full bg-accent/10 blur-3xl"
      />
      <Container>
        <SectionHeading stagger eyebrow={collection.eyebrow} title={collection.title} description={collection.description} />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((item, index) => {
            const Icon = icons[collectionItems[index % collectionItems.length].icon];
            const no = String(index + 1).padStart(2, "0");

            return (
              <Reveal key={index} variant="zoom" delay={(index % 4) * 70}>
                <TiltCard className="h-full" max={8}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface p-5 transition-colors duration-300 hover:border-accent/40">
                    <div
                      aria-hidden
                      className="absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-brand/25 to-accent/20 blur-2xl transition-transform duration-500 group-hover:scale-125"
                    />

                    {/* Dummy 3D visual: no render exists for this card yet. */}
                    <div aria-hidden className="relative mx-auto my-2 size-24" style={{ perspective: "500px" }}>
                      <span className="orbit-ring" />
                      <span className="orbit-ring" />
                      <span className="orbit-ring" />
                      <span className="absolute inset-0 m-auto inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-canvas shadow-glow">
                        <Icon className="size-5" aria-hidden />
                      </span>
                    </div>

                    <p className="relative text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-brand">{no}</p>
                    <h3 className="relative mt-1 text-base font-extrabold text-ink">{item.title}</h3>
                    <p className="relative mt-1 text-xs font-semibold italic text-ink-soft">{item.tagline}</p>
                    <p className="relative mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                    {item.highlights.length > 0 ? (
                      <div className="relative mt-auto flex flex-wrap gap-1.5 pt-4">
                        {item.highlights.map((h, i) => (
                          <span
                            key={i}
                            className={cn(
                              "rounded-pill bg-surface-raised px-2.5 py-1 text-[0.6875rem] font-medium leading-none text-ink-soft",
                            )}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
