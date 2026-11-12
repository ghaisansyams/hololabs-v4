import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { getSiteContent } from "@/lib/cms";

/**
 * FAQ accordion — mirrors meatguysteakhouse.com's expandable question list.
 * Questions and headings come from the CMS (Konten Website -> FAQ).
 */
export async function FaqSection() {
  const { faq } = await getSiteContent();
  const items = faq.items.filter((item) => item.question);

  return (
    <section id="faq" className="border-t border-line bg-canvas-deep py-10 sm:py-12">
      <Container className="max-w-2xl">
        <div className="text-center">
          <Reveal>
            <Eyebrow className="justify-center">{faq.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-4 text-3xl text-ink sm:text-4xl">{faq.title}</h2>
          </Reveal>
        </div>

        <FaqAccordion items={items} />
      </Container>
    </section>
  );
}
