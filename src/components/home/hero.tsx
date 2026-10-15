import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { HeroParallax } from "@/components/home/hero-parallax";
import { getSiteContent } from "@/lib/cms";
import { siteConfig } from "@/data/site";

/**
 * Full-bleed, centered hero — styled after meatguysteakhouse.com: a dark
 * photographic background, a short uppercase badge line, a big serif
 * headline, and two centered CTAs. No render exists for the hero yet, so
 * this reuses the company-profile image already shown in Ambiance.
 */
export async function Hero() {
  const { hero } = await getSiteContent();
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden py-24 sm:min-h-[92vh]">
      <HeroParallax src="/renders/ambiance-hall.jpg" alt="" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-canvas-deep/70 via-canvas-deep/55 to-canvas" />
      <div aria-hidden className="absolute inset-0 bg-canvas-deep/25" />

      <Container className="relative text-center">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent sm:text-sm">
            {siteConfig.name} · A Creative Technology Lab
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h1 className="mx-auto mt-6 max-w-3xl text-[2.25rem] leading-[1.1] text-ink sm:text-6xl">
            {hero.title} <span className="text-gradient italic">{hero.titleAccent}</span>
            {hero.titleSuffix}
          </h1>
        </Reveal>

        <Reveal delay={170}>
          <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft sm:text-base">
            {hero.lead}
          </p>
        </Reveal>

        <Reveal delay={250}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/pesan" className={buttonStyles({ size: "lg" })}>
              {hero.ctaPrimary}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/#collection" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              {hero.ctaSecondary}
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
