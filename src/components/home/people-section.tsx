import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import { getSiteContent } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

/**
 * Founder and a second key profile ("meat master" equivalent) — mirrors
 * meatguysteakhouse.com's two alternating photo/bio blocks. Real photos
 * supplied by the client; name, title and bio are still placeholder copy
 * pending the client's real data (editable from Admin -> Konten Website ->
 * Founder & Tim). The only motion is the scroll-triggered Reveal, same as
 * every other section.
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
          photo="/people/founder.jpg"
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

        <Profile
          reverse
          photo="/people/lead.jpg"
          name={people.leadName}
          title={people.leadTitle}
          bio={people.leadBio}
          delay={0}
        />
      </Container>
    </section>
  );
}

function Profile({
  reverse,
  photo,
  name,
  title,
  bio,
  delay,
}: {
  reverse: boolean;
  photo: string;
  name: string;
  title: string;
  bio: string;
  delay: number;
}) {
  return (
    <div className={cn("mt-10 grid items-center gap-8 lg:grid-cols-2 lg:gap-14", reverse && "lg:[&>*:first-child]:order-2")}>
      <Reveal variant={reverse ? "right" : "left"} delay={delay}>
        <TiltCard max={6}>
          <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-card border border-line">
            <Image src={photo} alt={name} fill sizes="(min-width: 1024px) 24rem, 90vw" className="object-cover" />
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
