import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getSiteContent } from "@/lib/cms";

/**
 * "About Us" — mirrors meatguysteakhouse.com's About Us, but leans into
 * personal branding. Intro copy only: the "Our Best Works" list and its
 * client logo strip were removed at the client's request.
 */
export async function AboutSection() {
  const { about } = await getSiteContent();

  return (
    <section id="about" className="py-8 sm:py-10">
      <Container className="max-w-3xl text-center">
        <Reveal>
          <Eyebrow className="justify-center">{about.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{about.title}</h2>
        </Reveal>
        <Reveal delay={100}>
          <span aria-hidden className="mx-auto mt-5 block h-px w-12 bg-accent" />
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-ink sm:text-xl sm:leading-9">{about.bodyShort}</p>
        </Reveal>
        <Reveal delay={220}>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-soft">{about.bodyLong}</p>
        </Reveal>
      </Container>
    </section>
  );
}
