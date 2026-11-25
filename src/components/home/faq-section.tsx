import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

/**
 * FAQ in two columns, as on hololabs.id: the title and a WhatsApp prompt on
 * the left, the expandable questions on the right. Questions and the title
 * come from the CMS (Konten Website -> FAQ).
 */
export async function FaqSection() {
  const { faq, contact } = await getSiteContent();
  const items = faq.items.filter((item) => item.question);
  const wa = toWhatsappE164(contact.whatsapp);

  return (
    <section id="faq" className="bg-hall relative isolate overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="hall-seam" />
      <div aria-hidden className="hall-floor -z-10 opacity-60" />
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="lg:pt-2">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3.1vw,2.6rem)] font-bold leading-[1.1] text-ink">{faq.title}</h2>
          </Reveal>
          {faq.askPrompt || faq.askLink ? (
          <Reveal delay={60}>
            <p className="mt-4 text-base text-ink-soft">
              {faq.askPrompt ? `${faq.askPrompt} ` : null}
              {faq.askLink ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {faq.askLink}
              </a>
              ) : null}
            </p>
          </Reveal>
          ) : null}
        </div>

        <FaqAccordion items={items} />
      </Container>
    </section>
  );
}
