import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { DummyMapCard } from "@/components/home/dummy-map-card";
import { InstagramIcon } from "@/components/layout/instagram-icon";
import { LinkedinIcon } from "@/components/layout/linkedin-icon";
import { WhatsappIcon } from "@/components/layout/whatsapp-icon";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";

const iconButton = cn(
  "inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-soft",
  "transition-colors hover:border-accent/50 hover:bg-accent-soft hover:text-accent",
);

const rowLink =
  "inline-flex min-h-11 items-center gap-3 text-sm text-ink-soft transition-colors hover:text-accent";

function ColumnTitle({ children }: { children: string }) {
  return <h2 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink">{children}</h2>;
}

/**
 * Footer in the layout of the Spero site: brand + socials, menu, contact and
 * follow-us columns, a bottom bar with copyright. The map card that used to
 * be its own homepage section lives in the bottom-right corner here.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const { contact, navigation, location } = await getSiteContent();
  const menuItems = navigation.menuItems.filter((item) => item.label && item.href);
  const whatsappHref = `https://wa.me/${toWhatsappE164(contact.whatsapp)}`;
  const instagram = contact.instagram.replace(/^@/, "");
  const linkedin = contact.linkedin.replace(/^@/, "");
  const addressLines = contact.address.split("\n").map((line) => line.trim()).filter(Boolean);

  const socials = [
    instagram && { label: "Instagram", href: `https://instagram.com/${instagram}`, icon: InstagramIcon },
    linkedin && { label: "LinkedIn", href: `https://www.linkedin.com/company/${linkedin}`, icon: LinkedinIcon },
    contact.email && { label: "Email", href: `mailto:${contact.email}`, icon: Mail },
    contact.whatsapp && { label: "WhatsApp", href: whatsappHref, icon: WhatsappIcon },
  ].filter((item): item is { label: string; href: string; icon: typeof Mail } => Boolean(item));

  return (
    <footer className="border-t border-line bg-canvas-deep/60">
      <Container className="max-w-none py-14 lg:px-16 lg:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-3">
            <Logo className="h-20 sm:h-24" />
            <p className="mt-5 text-sm font-bold text-ink">{contact.footerCopyright}</p>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{contact.footerText}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  {...(social.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={iconButton}
                >
                  <social.icon className="size-[1.125rem]" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Menu */}
          <nav className="lg:col-span-2" aria-label="Navigasi footer">
            <ColumnTitle>{contact.footerNavTitle}</ColumnTitle>
            <ul className="mt-3 flex flex-col">
              {menuItems.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-11 items-center text-sm text-ink-soft transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact + follow */}
          <div className="lg:col-span-3">
            <ColumnTitle>{contact.footerContactTitle}</ColumnTitle>
            <ul className="mt-3 space-y-1">
              {addressLines.length > 0 ? (
                <li className="flex items-start gap-3 py-2 text-sm leading-relaxed text-ink-soft">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span>
                    {addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                    {location.mapLink ? (
                      <a
                        href={location.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
                      >
                        {location.cardCta}
                      </a>
                    ) : null}
                  </span>
                </li>
              ) : null}
              {contact.whatsapp ? (
                <li>
                  <a href={whatsappHref} className={rowLink}>
                    <Phone className="size-4 shrink-0 text-accent" aria-hidden />
                    {contact.whatsapp}
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className={rowLink}>
                    <Mail className="size-4 shrink-0 text-accent" aria-hidden />
                    <span className="[overflow-wrap:anywhere]">{contact.email}</span>
                  </a>
                </li>
              ) : null}
            </ul>

            <div className="mt-6">
              <ColumnTitle>{contact.footerFollowTitle}</ColumnTitle>
              <ul className="mt-3 space-y-1">
                {instagram ? (
                  <li>
                    <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className={rowLink}>
                      <InstagramIcon className="size-4 shrink-0 text-accent" />@{instagram}
                    </a>
                  </li>
                ) : null}
                {linkedin ? (
                  <li>
                    <a
                      href={`https://www.linkedin.com/company/${linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={rowLink}
                    >
                      <LinkedinIcon className="size-4 shrink-0 text-accent" />
                      {linkedin}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          {/* Info sesi + peta (kanan bawah) */}
          <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-4 lg:justify-between">
            <div>
              <ColumnTitle>{contact.footerScheduleTitle}</ColumnTitle>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{contact.scheduleInfo}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {contact.footerWhatsappNote}{" "}
                <a href={whatsappHref} className="font-semibold text-accent hover:underline">
                  {contact.whatsapp}
                </a>
              </p>
            </div>
            <DummyMapCard compact />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {contact.footerCopyright}. All rights reserved.
          </p>
          <p>{contact.footerTagline}</p>
        </div>
      </Container>
    </footer>
  );
}
