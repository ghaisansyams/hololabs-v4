import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { CommandCenterScene } from "@/components/home/command-center-scene";
import { buttonStyles } from "@/components/ui/button";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

/**
 * Reservation block: a scroll-driven 3D Command Center room beside the pitch and the
 * show facts (when, where), then the two ways to come: booking online for
 * up to six people, or a private show for schools, companies and brands.
 */
export async function VisitSection() {
  const { visit, contact, location } = await getSiteContent();
  const whatsapp = toWhatsappE164(contact.whatsapp);
  const groupHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(visit.groupMessage)}`;
  const facts = visit.facts.filter((f) => f.label && f.value);
  const address = contact.address.split("\n").map((l) => l.trim()).filter(Boolean).join(", ");

  return (
    <section id="reservasi" className="bg-hall-flip relative isolate overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="hall-seam" />
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24">
          <div>
            <Reveal>
              <p className="font-label text-[0.8125rem] uppercase tracking-[0.3em] text-cyan sm:text-sm">{visit.eyebrow}</p>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.12] text-ink sm:text-4xl">{visit.title}</h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 max-w-lg text-lg leading-9 text-ink-soft">{visit.body}</p>
            </Reveal>
            <Reveal delay={200}>
              <Link href="/booking" className={buttonStyles({ size: "lg", className: "mt-8" })}>
                {visit.cta}
              </Link>
            </Reveal>

            {facts.length > 0 ? (
              <Reveal delay={260}>
                <dl className="mt-12 border-t border-line">
                  {facts.map((fact, index) => {
                    const isPlace = /lokasi/i.test(fact.label);
                    return (
                      <div key={index} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8">
                        <dt className="font-mono text-xs font-medium uppercase leading-7 tracking-[0.16em] text-cyan">{fact.label}</dt>
                        <dd>
                          <p className="text-lg text-ink">{fact.value}</p>
                          {isPlace && address ? <p className="mt-1 text-sm leading-7 text-muted">{address}</p> : null}
                          {fact.note ? <p className="mt-1 text-sm leading-7 text-muted">{fact.note}</p> : null}
                          {isPlace && location.mapLink ? (
                            <a
                              href={location.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-cyan hover:underline"
                            >
                              <MapPin className="size-4" aria-hidden />
                              {location.cardCta}
                            </a>
                          ) : null}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </Reveal>
            ) : null}
          </div>

          <Reveal variant="zoom" delay={120}>
            <CommandCenterScene note={visit.ticketNote} />
          </Reveal>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          <Reveal className="bg-[#07041a]/90">
            <div className="flex h-full flex-col p-7 sm:p-10">
              <h3 className="text-xl font-semibold text-ink sm:text-2xl">{visit.personalTitle}</h3>
              <p className="mt-3 max-w-md leading-8 text-ink-soft">{visit.personalBody}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {visit.personalTags.map((tag, i) => (
                  <li key={i} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-ink-soft">
                    {tag}
                  </li>
                ))}
              </ul>
              <Link href="/booking" className={buttonStyles({ variant: "secondary", className: "mt-8 self-start" })}>
                {visit.personalCta}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={90} className="bg-[#07041a]/90">
            <div className="flex h-full flex-col p-7 sm:p-10">
              <h3 className="text-xl font-semibold text-ink sm:text-2xl">{visit.groupTitle}</h3>
              <p className="mt-3 max-w-md leading-8 text-ink-soft">{visit.groupBody}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {visit.groupTags.map((tag, i) => (
                  <li key={i} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-ink-soft">
                    {tag}
                  </li>
                ))}
              </ul>
              <a
                href={groupHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "outline", className: "mt-8 self-start" })}
              >
                {visit.groupCta}
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
