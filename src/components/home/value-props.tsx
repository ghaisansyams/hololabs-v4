import { Clock, QrCode, Route, Users, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TiltCard } from "@/components/ui/tilt-card";
import { type ValueProp } from "@/data/site";
import { getSiteContent } from "@/lib/cms";

const icons: Record<ValueProp["icon"], LucideIcon> = {
  clock: Clock,
  users: Users,
  qr: QrCode,
  route: Route,
};

// Icons follow card position; the CMS edits only the text.
const ICON_ORDER: ValueProp["icon"][] = ["users", "route", "qr", "clock"];

export async function ValueProps() {
  const { valueProps } = await getSiteContent();
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow={valueProps.eyebrow}
          title={valueProps.title}
          description={valueProps.description}
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.items.map((item, index) => {
            const Icon = icons[ICON_ORDER[index % ICON_ORDER.length]];
            return (
              <Reveal key={index} delay={index * 70}>
                <TiltCard className="h-full" max={8}>
                  <article className="group h-full rounded-card border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-300 hover:border-brand/30 hover:shadow-lift">
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-canvas shadow-glow transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-lg font-extrabold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
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
