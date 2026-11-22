import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { HeroParallax } from "@/components/home/hero-parallax";
import { getSiteContent } from "@/lib/cms";

/**
 * First screen: a full-bleed photo of the immersive hall with the headline
 * centred over it (the layout of the earlier hololab.holomoc.com hero), set
 * in this site's type and buttons. Its bottom edge fades into the colour of
 * the 3D journey that follows, so the photo hands over to the scene.
 */
export async function HeroSection() {
  const { hero } = await getSiteContent();

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-dvh items-center overflow-hidden bg-[#040208]">
      <HeroParallax>
        <Image
          src={hero.backgroundImage || "/renders/ambiance-hall.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[55%_40%] motion-safe:animate-[hero-zoom_22s_ease-out_both]"
        />
      </HeroParallax>
      {/* darken for legibility: top for the header, centre for the copy, bottom into the journey */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-[#040208]/80 via-[#040208]/35 to-[#040208]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_50%_52%,rgb(4_2_8/0.55),transparent_75%)]" />

      <div className="container-gutter relative mx-auto w-full max-w-5xl pb-16 pt-28 text-center [@media(max-height:520px)]:pt-20">
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-cyan sm:text-xs">{hero.badge}</p>
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

      <a
        href="#journey"
        aria-label="Gulir ke journey"
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.3em] text-muted transition-colors hover:text-cyan [@media(max-height:520px)]:hidden"
      >
        Scroll
        <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
