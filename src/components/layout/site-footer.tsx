import Link from "next/link";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

const headingClass = "text-xs font-bold uppercase tracking-[0.16em] text-ink";
const linkClass = "inline-flex min-h-10 items-center text-[0.9375rem] text-ink-soft transition-colors hover:text-cyan";
const iconButton =
  "inline-flex size-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-cyan/60 hover:text-cyan";

/** lucide-react no longer ships brand icons, so the Instagram glyph is drawn here. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Footer in the standard layout of spero.id: logo, name and short line with
 * round contact buttons on the left; MENU, CONTACT and FOLLOW US columns;
 * a divider and the copyright. All text is editable in Konten Website
 * (brand, navigation, contact, location, about).
 */
export async function SiteFooter() {
  const { brand, contact, location, navigation, about } = await getSiteContent();
  const instagram = contact.instagram.replace(/^@/, "");
  const address = contact.address.split("\n").map((line) => line.trim()).filter(Boolean);
  const menu = navigation.menuItems.filter((item) => item.label && item.href);
  const wa = contact.whatsapp ? toWhatsappE164(contact.whatsapp) : "";

  return (
    <footer className="border-t border-line bg-canvas-deep/60">
      <Container className="max-w-none py-14 lg:px-16 lg:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo className="h-14 sm:h-16" />
            <p className="mt-5 text-base font-bold text-ink">{brand.siteName}</p>
            <p className="mt-1 text-sm text-ink-soft">{contact.footerTagline}</p>
            <div className="mt-5 flex gap-3">
              {instagram ? (
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconButton}>
                  <InstagramIcon className="size-[1.125rem]" />
                </a>
              ) : null}
              {wa ? (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={iconButton}>
                  <Phone className="size-[1.125rem]" aria-hidden />
                </a>
              ) : null}
              {address.length > 0 && location.mapLink ? (
                <a href={location.mapLink} target="_blank" rel="noopener noreferrer" aria-label="Lokasi di Google Maps" className={iconButton}>
                  <MapPin className="size-[1.125rem]" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>

          <nav aria-label="Menu footer">
            <h2 className={headingClass}>Menu</h2>
            <ul className="mt-4 flex flex-col">
              {menu.map((item, index) => (
                <li key={index}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={headingClass}>Kontak</h2>
            <ul className="mt-4 flex flex-col gap-4 text-[0.9375rem] text-ink-soft">
              {address.length > 0 ? (
                <li className="flex gap-3">
                  <MapPin className="mt-1 size-4 shrink-0 text-cyan" aria-hidden />
                  <div>
                    <p className="leading-7">
                      {address.map((line, index) => (
                        <span key={index} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                    {location.mapLink ? (
                      <a
                        href={location.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-cyan hover:underline"
                      >
                        {location.cardCta}
                        <ArrowUpRight className="size-4" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </li>
              ) : null}
              {wa ? (
                <li className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-cyan" aria-hidden />
                  <a href={`https://wa.me/${wa}`} className="transition-colors hover:text-cyan">
                    {contact.whatsapp}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          {instagram ? (
            <div>
              <h2 className={headingClass}>Ikuti kami</h2>
              <ul className="mt-4 flex flex-col">
                <li>
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className={`${linkClass} gap-3`}>
                    <InstagramIcon className="size-4 shrink-0 text-cyan" />@{instagram}
                  </a>
                </li>
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {contact.footerCopyright}
          </p>
          <p>{about.title}</p>
        </div>
      </Container>
    </footer>
  );
}
