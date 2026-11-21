import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import { buttonStyles } from "@/components/ui/button";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

/**
 * Reservation block: a tilting sample e-ticket beside the pitch and the
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
    <section id="reservasi" className="relative overflow-hidden border-t border-line py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 -z-10 size-[36rem] rounded-full bg-brand/15 blur-[120px]"
      />
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24">
          <div>
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">{visit.eyebrow}</p>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-5 text-4xl leading-[1.08] text-ink sm:text-5xl">{visit.title}</h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 max-w-lg text-lg leading-9 text-ink-soft">{visit.body}</p>
            </Reveal>
            <Reveal delay={200}>
              <Link href="/pesan" className={buttonStyles({ size: "lg", className: "mt-8" })}>
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
                        <dt className="text-xs font-bold uppercase leading-7 tracking-[0.16em] text-accent">{fact.label}</dt>
                        <dd>
                          <p className="text-lg text-ink">{fact.value}</p>
                          {isPlace && address ? <p className="mt-1 text-sm leading-7 text-muted">{address}</p> : null}
                          {fact.note ? <p className="mt-1 text-sm leading-7 text-muted">{fact.note}</p> : null}
                          {isPlace && location.mapLink ? (
                            <a
                              href={location.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
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
            <div className="mx-auto w-full max-w-sm">
              <TiltCard max={9}>
                <div className="relative overflow-hidden rounded-card border border-accent/40 bg-gradient-to-br from-[#150d28] to-[#2a1450] p-7 shadow-lift">
                  <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-brand/30 blur-3xl" />
                  <div className="relative flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">E-ticket</p>
                    <p className="rounded-pill bg-success-soft px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-success">
                      Confirmed
                    </p>
                  </div>
                  <p className="relative mt-6 font-display text-3xl font-bold text-ink">HOLOLABS</p>
                  <p className="relative mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Kode booking</p>
                  <p className="relative text-xl font-bold tabular-nums text-ink">HL-2611-X7K2</p>
                  <div className="relative mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
                    {[
                      ["Tanggal", "13 Nov"],
                      ["Show", "18.00"],
                      ["Tamu", "2"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{k}</p>
                        <p className="mt-1 text-lg font-bold text-ink">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div aria-hidden className="relative mt-6 flex h-10 items-stretch gap-[3px] opacity-70">
                    {Array.from({ length: 38 }, (_, i) => (
                      <span key={i} className="flex-1 rounded-[1px] bg-ink" style={{ opacity: [1, 0.35, 0.8, 0.5][i % 4], flexGrow: (i * 7) % 3 === 0 ? 2 : 1 }} />
                    ))}
                  </div>
                </div>
              </TiltCard>
              <p className="mt-4 text-center text-xs font-medium text-muted">{visit.ticketNote}</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2">
          <Reveal className="bg-canvas">
            <div className="flex h-full flex-col p-7 sm:p-10">
              <h3 className="text-2xl text-ink sm:text-3xl">{visit.personalTitle}</h3>
              <p className="mt-3 max-w-md leading-8 text-ink-soft">{visit.personalBody}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {visit.personalTags.map((tag, i) => (
                  <li key={i} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink-soft">
                    {tag}
                  </li>
                ))}
              </ul>
              <Link href="/pesan" className={buttonStyles({ variant: "secondary", className: "mt-8 self-start" })}>
                {visit.personalCta}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={90} className="bg-canvas">
            <div className="flex h-full flex-col p-7 sm:p-10">
              <h3 className="text-2xl text-ink sm:text-3xl">{visit.groupTitle}</h3>
              <p className="mt-3 max-w-md leading-8 text-ink-soft">{visit.groupBody}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {visit.groupTags.map((tag, i) => (
                  <li key={i} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink-soft">
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
