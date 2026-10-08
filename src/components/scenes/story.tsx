import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { brandCharacters } from "@/content/site";
import type { SiteContent } from "@/lib/site-content";

// Essence (ex-01, "Brand Essence") and Colors (ex-03, "Color Journey") were
// removed from the page on the client's 8 Oct 2026 revision — this site
// reads as a company profile, not a book-a-seat flow, and those two scenes
// didn't fit that framing. Their content/types stay in content/site.ts and
// lib/site-content.ts (harmless if unused) so nothing else has to change if
// they're ever restored; only the rendering here is gone. See clients.tsx
// for what replaced them further down the page.

/** Scene 01 — Integration. */
export function Integration({ content }: { content: SiteContent }) {
  const { integration } = content;
  return (
    <Section
      id="integration"
      describe="Tiga bidang kaca transparan yang saling bertumpuk terurai menjadi lapisan terpisah lalu menumpuk kembali menjadi satu."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="01">{integration.eyebrow}</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-3xl" accent={integration.titleAccent}>
          {integration.title}
        </Display>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <Reveal delay={140}>
          <div className="space-y-5 text-white/70">
            {integration.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <ul className="space-y-4">
          {integration.layers.map((layer, i) => (
            <Reveal as="li" key={layer.label} delay={200 + i * 70}>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="holo-eyebrow !text-white/80">{layer.label}</p>
                <p className="mt-2 text-sm text-white/60">{layer.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>

      <Reveal delay={360}>
        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
          {integration.ecosystem.map((node, i) => (
            <li key={node.label} className="bg-[var(--holo-ink)] p-5">
              <p
                className="text-xs font-semibold tracking-[0.14em]"
                style={{
                  color: [
                    "var(--holo-cyan)",
                    "var(--holo-blue)",
                    "var(--holo-violet)",
                    "var(--holo-magenta)",
                    "var(--holo-magenta)",
                  ][i],
                }}
              >
                {node.label.toUpperCase()}
              </p>
              <p className="mt-2.5 text-xs leading-relaxed text-white/55">{node.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}

/** Scene 02 — Our DNA, lima karakter brand. */
export function Dna() {
  return (
    <Section
      id="dna"
      describe="Lima kartu karakter brand masuk berurutan dari kedalaman, masing-masing dengan cahaya tepi berwarna sendiri."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="02">Our DNA</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent="brand characters.">
          Five
        </Display>
      </Reveal>

      <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {brandCharacters.map((character, i) => (
          <Reveal as="li" key={character.key} delay={120 + i * 70}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-500 hover:border-white/25">
              <span className="holo-eyebrow tabular-nums">0{i + 1}</span>
              <p
                className="holo-display mt-4 text-xl"
                style={{
                  color: [
                    "var(--holo-cyan)",
                    "var(--holo-violet)",
                    "var(--holo-blue)",
                    "var(--holo-magenta)",
                    "var(--holo-cyan)",
                  ][i],
                }}
              >
                {character.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{character.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
