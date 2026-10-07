import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { SiteContent } from "@/lib/site-content";

const LAYER_COLORS = [
  "var(--holo-cyan)",
  "var(--holo-violet)",
  "var(--holo-blue)",
  "var(--holo-magenta)",
];

/** Scene 10 — The HOLOLABS Ecosystem. */
export function Ecosystem({ content }: { content: SiteContent }) {
  const { ecosystem } = content;
  return (
    <Section
      id="ecosystem"
      describe="Empat lempeng isometrik mewakili layer Immersive, Interactive, Intelligent, dan Physical; saat di-scroll keempatnya menumpuk menjadi satu bangunan."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="06">{ecosystem.eyebrow}</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent={ecosystem.titleAccent}>
          {ecosystem.title}
        </Display>
      </Reveal>

      <Reveal delay={140}>
        <p className="mt-6 max-w-xl text-white/70">{ecosystem.lead}</p>
      </Reveal>

      <ol className="mt-14 space-y-3">
        {ecosystem.layers.map((layer, i) => (
          <Reveal as="li" key={layer.key} delay={180 + i * 80}>
            <div
              className="rounded-2xl border bg-white/[0.02] p-6 sm:flex sm:items-center sm:gap-8"
              style={{ borderColor: `color-mix(in srgb, ${LAYER_COLORS[i]} 30%, transparent)` }}
            >
              <p
                className="holo-display w-40 shrink-0 text-xl"
                style={{ color: LAYER_COLORS[i] }}
              >
                {layer.title}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/60 sm:mt-0">
                {layer.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={520}>
        <p className="holo-display mt-14 text-3xl sm:text-4xl">
          Ketika seluruh layer bertemu:
          <br />
          <span className="holo-gradient-text">{ecosystem.closing}</span>
        </p>
      </Reveal>
    </Section>
  );
}
