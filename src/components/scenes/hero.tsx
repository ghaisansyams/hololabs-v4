import Image from "next/image";

import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { SiteContent } from "@/lib/site-content";

export function Hero({ content }: { content: SiteContent }) {
  const { hero, identity } = content;
  return (
    <Section
      id="hero"
      describe="Logo H berbahan kaca melayang di dalam koridor imersif berwarna cyan hingga magenta, dengan siluet pengunjung berjalan menjauh."
      className="flex min-h-[100svh] items-center py-24"
    >
      <div className="max-w-3xl">
        <Reveal>
          <Image src="/hololabs-lockup.png" alt="HOLOLABS" width={1269} height={756} priority className="h-14 w-auto sm:h-16" />
        </Reveal>

        <Reveal delay={40}>
          <p className="holo-eyebrow mt-8">{hero.eyebrow}</p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="holo-display mt-5 text-5xl sm:text-7xl lg:text-8xl">
            {hero.title}
            <br />
            <span className="holo-gradient-text">{hero.titleAccent}</span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <div className="holo-rule mt-7 w-28" />
        </Reveal>

        <Reveal delay={220}>
          <p className="mt-7 max-w-xl text-base text-white/70 sm:text-lg">{hero.lead}</p>
        </Reveal>

        <Reveal delay={300}>
          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {identity.pillars.map((pillar, i) => (
              <li key={pillar} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block size-1.5 rounded-full"
                  style={{
                    background: ["var(--holo-cyan)", "var(--holo-violet)", "var(--holo-magenta)"][i],
                  }}
                />
                <span className="tracking-[0.14em] text-white/75">{pillar.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={380}>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={hero.ctaPrimary.href}
              className="rounded-full px-6 py-3 text-sm font-medium text-[var(--holo-ink)] transition-transform duration-300 hover:scale-[1.03]"
              style={{ background: "var(--holo-gradient)" }}
            >
              {hero.ctaPrimary.label}
            </a>
            <a
              href={hero.ctaSecondary.href}
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/85 transition hover:border-white/50 hover:text-white"
            >
              {hero.ctaSecondary.label}
            </a>
          </div>
        </Reveal>

        <Reveal delay={460}>
          <ul className="mt-16 flex flex-wrap gap-x-5 gap-y-1 text-[11px] tracking-[0.2em] text-white/35">
            {hero.keywords.map((word) => (
              <li key={word}>{word.toUpperCase()}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
