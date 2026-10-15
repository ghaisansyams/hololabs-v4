import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { InstagramIcon } from "@/components/layout/instagram-icon";
import { WhatsappIcon } from "@/components/layout/whatsapp-icon";
import { footerNav, siteConfig } from "@/data/site";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";

const socialIcons = { instagram: InstagramIcon, mail: Mail, whatsapp: WhatsappIcon } as const;

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const { contact } = await getSiteContent();
  const whatsappHref = `https://wa.me/${toWhatsappE164(contact.whatsapp)}`;
  const socialLinks = [
    contact.whatsapp && { label: "WhatsApp Admin", handle: contact.whatsapp, href: whatsappHref, icon: "whatsapp" as const },
    contact.email && { label: "Email", handle: contact.email, href: `mailto:${contact.email}`, icon: "mail" as const },
    contact.instagram && {
      label: "Instagram",
      handle: `@${contact.instagram.replace(/^@/, "")}`,
      href: `https://instagram.com/${contact.instagram.replace(/^@/, "")}`,
      icon: "instagram" as const,
    },
  ].filter((link) => !!link);

  return (
    <footer className="mt-24 border-t border-line bg-canvas-deep/60">
      <Container className="py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5 lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{contact.footerText}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map((social) => {
                const Icon = socialIcons[social.icon];
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={`${social.label} — ${social.handle}`}
                    {...(social.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={cn(
                      "inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft",
                      "transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent",
                    )}
                  >
                    <Icon className="size-[1.125rem]" aria-hidden />
                  </a>
                );
              })}
            </div>
          </div>

          <nav className="md:col-span-3 lg:col-span-2" aria-label="Navigasi footer">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink">Jelajahi</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {footerNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-12 lg:col-span-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink">Informasi Sesi</h2>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p>
                {contact.scheduleInfo}
              </p>
              <p className="leading-relaxed">
                Konfirmasi pembayaran & pertanyaan lain lewat WhatsApp:{" "}
                <a href={whatsappHref} className="font-semibold text-accent hover:underline">
                  {contact.whatsapp}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-xs text-muted">
          <p>
            © {year} {siteConfig.name}.
          </p>
        </div>
      </Container>
    </footer>
  );
}
