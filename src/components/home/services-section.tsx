import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { serviceCategories } from "@/data/services";

export function ServicesSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Tentang Hololabs"
          title="Teknologi di balik pengalamannya"
          description="Hololabs menghadirkan teknologi imersif lintas lini — exhibition ini adalah salah satu cara merasakannya langsung."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceCategories.map((category, index) => (
            <Reveal key={category.title} delay={index * 50}>
              <div className="h-full rounded-card border border-line bg-surface p-5">
                <h3 className="text-sm font-extrabold text-accent">{category.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {category.items.map((item) => (
                    <li key={item} className="text-xs leading-relaxed text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
