import { Bot, Disc3, Gamepad2, Glasses, Home, Monitor, Printer, Projector, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TiltCard } from "@/components/ui/tilt-card";
import { serviceCategories, type ServiceIcon } from "@/data/services";
import { getSiteContent } from "@/lib/cms";

const icons: Record<ServiceIcon, LucideIcon> = {
  projector: Projector,
  monitor: Monitor,
  gamepad: Gamepad2,
  bot: Bot,
  glasses: Glasses,
  printer: Printer,
  home: Home,
  disc: Disc3,
};

export async function ServicesSection() {
  const { services } = await getSiteContent();
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow={services.eyebrow}
          title={services.title}
          description={services.description}
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.categories.map((category, index) => {
            // Icons follow position; a category added in the CMS beyond the
            // original eight reuses the icon set from the start.
            const Icon = icons[serviceCategories[index % serviceCategories.length].icon];
            return (
              <Reveal key={index} delay={index * 50}>
                <TiltCard className="h-full" max={8}>
                  <div className="group relative h-full overflow-hidden rounded-card border border-line bg-surface p-5 transition-colors duration-300 hover:border-accent/40">
                    <div
                      aria-hidden
                      className="absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-brand/25 to-accent/20 blur-2xl transition-transform duration-500 group-hover:scale-125"
                    />
                    <span className="relative inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-canvas shadow-glow">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="relative mt-4 text-sm font-extrabold text-ink">{category.title}</h3>
                    <div className="relative mt-3 flex flex-wrap gap-1.5">
                      {category.items.map((item, i) => (
                        <span
                          key={i}
                          className="rounded-pill bg-surface-raised px-2.5 py-1 text-[0.6875rem] font-medium leading-none text-ink-soft"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
