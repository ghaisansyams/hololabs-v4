import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { HeroParallax } from "@/components/home/hero-parallax";
import { HeroPattern } from "@/components/home/hero-pattern";
import { getSiteContent } from "@/lib/cms";

/**
 * First screen: the headline centred over a dark field of curved light lines
 * rising from a glowing portal (after the pattern on polygon.technology). Its bottom edge fades into the colour of the 3D
 * journey that follows.
 */
export async function HeroSection() {
  const { hero } = await getSiteContent();

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-dvh items-center overflow-hidden bg-[#040208]">
      <HeroParallax>
        <HeroPattern />
      </HeroParallax>
      {/* a violet glow where the lines rise from, and a fade into the journey below */}
      <div aria-hidden className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_65%_55%_at_50%_105%,rgb(109_40_217/0.32),transparent_70%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-20 bg-gradient-to-b from-transparent to-[#040208]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_45%_35%_at_50%_50%,rgb(4_2_8/0.7),transparent_80%)]" />

      <div className="container-gutter relative mx-auto w-full max-w-5xl pb-16 pt-28 text-center [@media(max-height:520px)]:pt-20">
        <p className="mx-auto max-w-[30ch] text-balance font-display text-[0.625rem] font-medium uppercase leading-relaxed tracking-[0.22em] text-cyan sm:max-w-none sm:text-xs sm:tracking-[0.3em]">{hero.badge}</p>
        <h1
          id="hero-title"
          className="mx-auto mt-6 max-w-[18ch] text-[1.85rem] font-semibold leading-[1.12] text-ink sm:text-5xl lg:text-[3.6rem] [@media(max-height:520px)]:text-3xl"
        >
          {hero.title}{" "}
          <span className="bg-gradient-to-r from-cyan via-[#818cf8] to-[#e879f9] bg-clip-text text-transparent">{hero.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] leading-7 text-ink-soft sm:text-base sm:leading-8">{hero.lead}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/booking" className={buttonStyles({ size: "lg" })}>
            {hero.ctaPrimary}
          </Link>
          <a href="#journey" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            {hero.ctaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}
