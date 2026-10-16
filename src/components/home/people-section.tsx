import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import { getSiteContent } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Founder and a second key profile ("meat master" equivalent) — mirrors
 * meatguysteakhouse.com's two alternating photo/bio blocks. No real photos
 * exist yet, so each profile gets a plain monogram card instead of a
 * fabricated photo; the only motion is the scroll-triggered Reveal, same
 * as every other section. Name and bio are placeholder copy pending the
 * client's real data (editable from Admin -> Konten Website -> Founder &
 * Tim).
 */
export async function PeopleSection() {
  const { people } = await getSiteContent();

  return (
    <section id="people" className="py-20 sm:py-28">
      <Container>
        <div className="text-center">
          <Reveal>
            <Eyebrow className="justify-center">{people.eyebrow}</Eyebrow>
          </Reveal>
        </div>

        <Profile
          reverse={false}
          name={people.founderName}
          title={people.founderTitle}
          bio={people.founderBio}
          delay={0}
        />

        <div className="mt-16 text-center sm:mt-24">
          <Reveal>
            <p className="text-2xl text-ink sm:text-3xl">{people.leadEyebrow}</p>
          </Reveal>
        </div>

        <Profile reverse name={people.leadName} title={people.leadTitle} bio={people.leadBio} delay={0} />
      </Container>
    </section>
  );
}

function Profile({
  reverse,
  name,
  title,
  bio,
  delay,
}: {
  reverse: boolean;
  name: string;
  title: string;
  bio: string;
  delay: number;
}) {
  return (
    <div className={cn("mt-10 grid items-center gap-8 lg:grid-cols-2 lg:gap-14", reverse && "lg:[&>*:first-child]:order-2")}>
      <Reveal variant={reverse ? "right" : "left"} delay={delay}>
        <TiltCard max={6}>
          <div className="relative mx-auto flex aspect-[4/5] max-w-sm items-center justify-center overflow-hidden rounded-card border border-line bg-gradient-to-br from-surface via-surface to-brand/15">
            <span className="font-display text-6xl font-bold text-gradient">{initials(name)}</span>
          </div>
        </TiltCard>
      </Reveal>

      <Reveal variant={reverse ? "left" : "right"} delay={delay + 60}>
        <div>
          <h3 className="text-2xl text-ink sm:text-3xl">{name}</h3>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-accent">{title}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{bio}</p>
        </div>
      </Reveal>
    </div>
  );
}
