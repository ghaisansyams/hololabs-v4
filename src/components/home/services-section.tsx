import { Bot, Coffee, Disc3, Gamepad2, Home, Monitor, Printer, Projector, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TiltCard } from "@/components/ui/tilt-card";
import { facilities as facilityDefaults, type FacilityIcon } from "@/data/facilities";
import { getSiteContent } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

const icons: Record<FacilityIcon, LucideIcon> = {
  projector: Projector,
  disc: Disc3,
  bot: Bot,
  home: Home,
  printer: Printer,
  gamepad: Gamepad2,
  monitor: Monitor,
  coffee: Coffee,
};

const LAST_SPAN = ["", "lg:col-span-2", "lg:col-span-3", "lg:col-span-4"];

/**
 * "Fasilitas Hololabs": a bento grid of the zones inside the venue. The
 * first zone is featured (2×2 with spinning 3D rings); the last one
 * stretches to close the final row, whatever count the CMS holds.
 */
export async function ServicesSection() {
  const { services } = await getSiteContent();
  const list = services.facilities;
  // Featured card takes 4 cells of a 4-column grid; the rest take 1 each.
  const leftover = (list.length + 3) % 4;
  const lastSpan = leftover === 0 ? 0 : 4 - leftover;

  return (
    <section id="fasilitas" className="py-16 sm:py-24">
      <Container>
        <SectionHeading stagger eyebrow={services.eyebrow} title={services.title} description={services.description} />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((facility, index) => {
            // Icons follow position; zones added in the CMS beyond the
            // defaults reuse the icon set from the start.
            const Icon = icons[facilityDefaults[index % facilityDefaults.length].icon];
            const featured = index === 0;
            const isLast = index === list.length - 1 && !featured;
            const zone = `Zona ${String(index + 1).padStart(2, "0")}`;

            return (
              <Reveal
                key={index}
                variant="zoom"
                delay={(index % 4) * 70}
                className={cn(
                  featured && "sm:col-span-2 lg:row-span-2",
                  isLast && lastSpan > 0 && cn("sm:col-span-2", LAST_SPAN[lastSpan]),
                )}
              >
                <TiltCard className="h-full" max={featured ? 5 : 8}>
                  <article
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface p-5 transition-colors duration-300 hover:border-accent/40",
                      featured && "bg-gradient-to-br from-surface via-surface to-brand/15 p-6 sm:p-8",
                    )}
                  >
                    <div
                      aria-hidden
                      className="absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-brand/25 to-accent/20 blur-2xl transition-transform duration-500 group-hover:scale-125"
                    />

                    {featured ? (
                      <div aria-hidden className="relative mx-auto my-4 size-44 sm:size-56" style={{ perspective: "600px" }}>
                        <span className="orbit-ring" />
                        <span className="orbit-ring" />
                        <span className="orbit-ring" />
                        <span className="absolute inset-0 m-auto inline-flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-accent text-canvas shadow-glow sm:size-24">
                          <Icon className="size-9 sm:size-11" />
                        </span>
                      </div>
                    ) : (
                      <span className="relative inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-canvas shadow-glow">
                        <Icon className="size-5" aria-hidden />
                      </span>
                    )}

                    <p className="relative mt-4 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-brand">{zone}</p>
                    <h3 className={cn("relative mt-1 font-extrabold text-ink", featured ? "text-2xl sm:text-3xl" : "text-base")}>
                      {facility.title}
                    </h3>
                    <p className={cn("relative mt-2 leading-relaxed text-muted", featured ? "text-sm sm:text-base" : "text-sm")}>
                      {facility.description}
                    </p>
                    {facility.highlights.length > 0 ? (
                      <div className="relative mt-auto flex flex-wrap gap-1.5 pt-4">
                        {facility.highlights.map((item, i) => (
                          <span
                            key={i}
                            className="rounded-pill bg-surface-raised px-2.5 py-1 text-[0.6875rem] font-medium leading-none text-ink-soft"
                          >
                            {item}
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
