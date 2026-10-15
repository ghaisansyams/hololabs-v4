import { Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { InstagramIcon } from "@/components/layout/instagram-icon";
import { WhatsappIcon } from "@/components/layout/whatsapp-icon";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

const icons = { instagram: InstagramIcon, mail: Mail, whatsapp: WhatsappIcon } as const;

/**
 * Contact & location — a centered icon-link row, mirroring
 * meatguysteakhouse.com's contact block below its reservation CTA.
 */
export async function ContactSection() {
  const { contact } = await getSiteContent();
  const whatsappHref = `https://wa.me/${toWhatsappE164(contact.whatsapp)}`;
  const links = [
    contact.whatsapp && { label: contact.whatsapp, href: whatsappHref, icon: "whatsapp" as const },
    contact.email && { label: contact.email, href: `mailto:${contact.email}`, icon: "mail" as const },
    contact.instagram && {
      label: `@${contact.instagram.replace(/^@/, "")}`,
      href: `https://instagram.com/${contact.instagram.replace(/^@/, "")}`,
      icon: "instagram" as const,
    },
  ].filter((l): l is { label: string; href: string; icon: keyof typeof icons } => Boolean(l));

  return (
    <section className="border-t border-line py-16 sm:py-20">
      <Container className="text-center">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{contact.scheduleInfo}</p>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {links.map((link) => {
              const Icon = icons[link.icon];
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-accent"
                >
                  <Icon className="size-4" aria-hidden />
                  {link.label}
                </a>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
