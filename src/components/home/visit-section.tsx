import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { RoomScene } from "@/components/home/room-scene";
import { buttonStyles } from "@/components/ui/button";
import { getSiteContent } from "@/lib/cms";
import { toWhatsappE164 } from "@/lib/utils/phone";

/**
 * Reservation block: the pitch with a photo of the command room under it on
 * the left, a photo of the mezzanine audience seating on the right (same
 * card, bottoms aligned; a click opens the room's pop up), then the two ways to
 * come: booking online for up to six people, or a private show for schools,
 * companies and brands.
 */
export async function VisitSection() {
  const { visit, contact } = await getSiteContent();
  const whatsapp = toWhatsappE164(contact.whatsapp);
  const groupHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(visit.groupMessage)}`;

  return (
    <section id="reservasi" className="bg-hall-flip relative isolate overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="hall-seam" />
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end lg:gap-14">
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
            <Reveal delay={120} className="mt-10">
              <RoomScene
                note={visit.ticketNote}
                hint={visit.sceneHint}
                info={{
                  floor: visit.commandFloor,
                  title: visit.commandTitle,
                  body: visit.commandBody,
                  photos: [visit.commandPhoto1, visit.commandPhoto2, visit.commandPhoto3].filter(Boolean),
                }}
              />
            </Reveal>
          </div>

          <Reveal delay={180}>
            <RoomScene
              note={visit.deckNote}
              hint={visit.sceneHint}
              info={{
                floor: visit.deckFloor,
                title: visit.deckTitle,
                body: visit.deckBody,
                photos: [visit.deckPhoto1, visit.deckPhoto2, visit.deckPhoto3].filter(Boolean),
              }}
            />
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
