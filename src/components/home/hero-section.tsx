import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { getSiteContent } from "@/lib/cms";

/** First screen: the headline centred on a plain dark background (no 3D). */
export async function HeroSection() {
  const { hero } = await getSiteContent();

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-dvh items-center overflow-hidden bg-[#040208]">

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
