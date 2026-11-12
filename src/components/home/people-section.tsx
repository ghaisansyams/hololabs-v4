import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { getSiteContent } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

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
    <section id="people" className="py-14 sm:py-20">
      <Container className="space-y-14 sm:space-y-20">
        <Profile
          heading={people.founderHeading}
          subtitle={people.founderSubtitle}
          name={people.founderName}
          title={people.founderTitle}
          bio={people.founderBio}
        />
        <Profile
          reverse
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
  heading,
  subtitle,
  name,
  title,
  bio,
}: {
  reverse?: boolean;
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

      <div className="mt-8 grid items-center gap-6 sm:mt-10 lg:grid-cols-2 lg:gap-12">
        <Reveal variant={reverse ? "right" : "left"} className={cn(reverse && "lg:order-2")}>
          <div
            className={cn(
              "relative mx-auto flex aspect-square w-full max-w-[500px] items-center justify-center border border-line bg-surface",
              reverse ? "lg:ml-0" : "lg:mr-0",
            )}
          >
            <Image
              src="/hololabs-mark.png"
              alt={name}
              width={715}
              height={586}
              sizes="(min-width: 1024px) 280px, 55vw"
              className="h-auto w-[56%] object-contain"
            />
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
