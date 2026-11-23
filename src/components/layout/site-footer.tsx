import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

const headingClass = "font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted";
const linkClass = "inline-flex min-h-10 items-center text-[0.9375rem] text-ink-soft transition-colors hover:text-cyan";
const accentLinkClass = "inline-flex min-h-10 items-center text-[0.9375rem] text-cyan transition-colors hover:underline";

/**
 * Footer in the width of the header: the brand and a short pitch with the
 * booking button, then the menu, show schedule, contact and venue in their
 * own columns, and a bottom bar with the copyright. All text is editable in
 * Konten Website (contact, location, navigation, visit).
 */
export async function SiteFooter() {
  const { contact, location, navigation, visit } = await getSiteContent();
  const instagram = contact.instagram.replace(/^@/, "");
  const address = contact.address.split("\n").map((line) => line.trim()).filter(Boolean).join(", ");
  const schedule = visit.facts.filter((f) => f.label && f.value && !/lokasi/i.test(f.label));
  const menu = navigation.menuItems.filter((item) => item.label && item.href);

  return (
    <footer className="border-t border-line bg-canvas-deep/60">
      <Container className="max-w-none py-14 lg:px-16 lg:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_minmax(0,1.3fr)] lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo className="h-14 sm:h-16" />
            <p className="mt-4 text-sm font-medium text-ink">{contact.footerTagline}</p>
            {contact.footerAbout ? <p className="mt-3 max-w-sm text-sm leading-7 text-ink-soft">{contact.footerAbout}</p> : null}
            <Link href="/booking" className={buttonStyles({ size: "sm", className: "mt-6" })}>
              {navigation.reservationLabel}
            </Link>
          </div>

          <nav aria-label="Menu footer">
            <h2 className={headingClass}>Menu</h2>
            <ul className="mt-3 flex flex-col">
              {menu.map((item, index) => (
                <li key={index}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
              {menu.some((item) => item.href === "/cek-tiket") ? null : (
                <li>
                  <Link href="/cek-tiket" className={linkClass}>
                    Cek Tiket
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div>
            <h2 className={headingClass}>Jadwal</h2>
            {schedule.length > 0 ? (
              <dl className="mt-3 flex flex-col gap-4 text-[0.9375rem]">
                {schedule.map((fact, index) => (
                  <div key={index}>
                    <dt className="text-ink-soft">{fact.label}</dt>
                    <dd className="mt-1 font-medium text-ink">{fact.value}</dd>
                    {fact.note ? <dd className="mt-0.5 text-sm text-muted">{fact.note}</dd> : null}
                  </div>
                ))}
              </dl>
            ) : null}
            <Link href="/booking" className={`${accentLinkClass} mt-3`}>
              Lihat jadwal
              <ArrowUpRight className="ml-1 size-4" aria-hidden />
            </Link>
          </div>

          <div>
            <h2 className={headingClass}>Kontak</h2>
            <ul className="mt-3 flex flex-col">
              {contact.whatsapp ? (
                <li>
                  <span className="block text-sm text-muted">WhatsApp</span>
                  <a href={`https://wa.me/${toWhatsappE164(contact.whatsapp)}`} className={accentLinkClass}>
                    {contact.whatsapp}
                  </a>
                </li>
              ) : null}
              {instagram ? (
                <li className="mt-2">
                  <span className="block text-sm text-muted">Instagram</span>
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className={accentLinkClass}>
                    @{instagram}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          {address ? (
            <div className="sm:col-span-2 lg:col-span-1">
              <h2 className={headingClass}>Lokasi</h2>
              <p className="mt-3 text-[0.9375rem] leading-7 text-ink-soft">{address}</p>
              {location.mapLink ? (
                <a href={location.mapLink} target="_blank" rel="noopener noreferrer" className={`${accentLinkClass} mt-2`}>
                  {location.cardCta}
                  <ArrowUpRight className="ml-1 size-4" aria-hidden />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {contact.footerCopyright}
          </p>
          <a href="#" className="transition-colors hover:text-cyan">
            Kembali ke atas ↑
          </a>
        </div>
      </Container>
    </footer>
  );
}
