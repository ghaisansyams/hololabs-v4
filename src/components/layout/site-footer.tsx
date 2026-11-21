import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

const linkClass = "mt-2 inline-flex min-h-11 items-center text-cyan transition-colors hover:underline";

/**
 * Footer laid out like hololabs.id: the logo with a one-line description on
 * the left, and WhatsApp, Instagram and the venue address on the right.
 */
export async function SiteFooter() {
  const { contact, location } = await getSiteContent();
  const instagram = contact.instagram.replace(/^@/, "");
  const address = contact.address.split("\n").map((line) => line.trim()).filter(Boolean).join(", ");

  return (
    <footer className="border-t border-line bg-canvas-deep/60">
      <Container className="max-w-none py-12 lg:px-16 lg:py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div>
            <Logo className="h-14 sm:h-16" />
            <p className="mt-4 text-sm text-ink-soft">{contact.footerTagline}</p>
          </div>

          <dl className="grid gap-8 text-sm sm:grid-cols-[auto_auto_minmax(0,18rem)] sm:gap-12">
            {contact.whatsapp ? (
              <div>
                <dt className="text-ink-soft">WhatsApp</dt>
                <dd>
                  <a href={`https://wa.me/${toWhatsappE164(contact.whatsapp)}`} className={linkClass}>
                    {contact.whatsapp}
                  </a>
                </dd>
              </div>
            ) : null}
            {instagram ? (
              <div>
                <dt className="text-ink-soft">Instagram</dt>
                <dd>
                  <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    @{instagram}
                  </a>
                </dd>
              </div>
            ) : null}
            {address ? (
              <div>
                <dt className="text-ink-soft">Lokasi</dt>
                <dd>
                  <p className="mt-2 leading-7 text-ink-soft">{address}</p>
                  {location.mapLink ? (
                    <a href={location.mapLink} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {location.cardCta}
                    </a>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </Container>
    </footer>
  );
}
