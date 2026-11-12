import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { getSiteContent } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

const PLACEHOLDER = "/hololabs-mark.png";

/**
 * Founder and a second key profile — mirrors meatguysteakhouse.com's two
 * alternating blocks: a centred heading with a one-line subtitle, then a
 * square photo beside the name, role and a few justified paragraphs with
 * bold highlights. Everything is square-cornered and tightly spaced.
 * The portrait slot shows the Hololabs icon until real photos and bios arrive;
 * the copy is lorem ipsum for now (editable from Admin -> Konten Website -> Founder & Tim).
 */
export async function PeopleSection() {
  const { people } = await getSiteContent();

  return (
    <section id="people" className="py-8 sm:py-10">
      <Container className="space-y-16 sm:space-y-20">
        <Profile
          photo={people.founderPhoto}
          heading={people.founderHeading}
          subtitle={people.founderSubtitle}
          name={people.founderName}
          title={people.founderTitle}
          bio={people.founderBio}
        />
        <Profile
          reverse
          photo={people.leadPhoto}
          heading={people.leadHeading}
          subtitle={people.leadSubtitle}
          name={people.leadName}
          title={people.leadTitle}
          bio={people.leadBio}
        />
      </Container>
    </section>
  );
}

/** Paragraphs split on blank lines; **word** is rendered bold. */
function renderBio(bio: string): ReactNode[] {
  return bio
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph, i) => (
      <p key={i}>
        {paragraph.split(/\*\*(.+?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-bold text-ink">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
      </p>
    ));
}

function Profile({
  reverse = false,
  photo,
  heading,
  subtitle,
  name,
  title,
  bio,
}: {
  reverse?: boolean;
  photo: string;
  heading: string;
  subtitle: string;
  name: string;
  title: string;
  bio: string;
}) {
  return (
    <div>
      <Reveal>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-accent sm:text-4xl">{heading}</h2>
          {subtitle ? <p className="mt-2 text-sm text-ink-soft sm:text-base">{subtitle}</p> : null}
        </div>
      </Reveal>

      <div
        className={cn(
          "mt-8 grid items-center gap-6 sm:mt-10 lg:gap-12",
          // The photo is pinned to the outer edge of the container (left for
          // the founder, right for the second profile), flush with the text
          // block's own edge; the text takes whatever width is left.
          reverse ? "lg:grid-cols-[1fr_500px]" : "lg:grid-cols-[500px_1fr]",
        )}
      >
        <Reveal variant={reverse ? "right" : "left"} className={cn(reverse && "lg:order-2")}>
          <div className="relative mx-auto flex aspect-square w-full max-w-[500px] items-center justify-center border border-line bg-surface lg:mx-0">
            {/* The built-in placeholder is the logo, shown small and centred;
                an uploaded photo fills the square. */}
            {photo === PLACEHOLDER ? (
              <Image
                src={photo}
                alt={name}
                width={715}
                height={586}
                sizes="(min-width: 1024px) 280px, 55vw"
                className="h-auto w-[56%] object-contain"
              />
            ) : (
              <Image
                src={photo}
                alt={name}
                fill
                sizes="(min-width: 1024px) 500px, 90vw"
                className="object-cover object-top"
              />
            )}
          </div>
        </Reveal>

        <Reveal variant={reverse ? "left" : "right"} delay={60} className={cn(reverse && "lg:order-1")}>
          <div>
            <h3 className="text-2xl font-bold text-accent sm:text-3xl">{name}</h3>
            <p className="mt-1 text-base font-bold text-ink">{title}</p>
            <div className="mt-4 space-y-3 text-sm sm:text-justify leading-relaxed text-ink-soft sm:text-base">
              {renderBio(bio)}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
