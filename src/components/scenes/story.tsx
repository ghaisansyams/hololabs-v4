import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { brandCharacters } from "@/content/site";
import type { SiteContent } from "@/lib/site-content";

/** Scene 02 — Brand Essence dan filosofi simbol H. */
export function Essence({ content }: { content: SiteContent }) {
  const { essence } = content;
  return (
    <Section
      id="essence"
      describe="Dua sisi logo H memisah ke kiri dan kanan menyingkap label Physical World dan Digital World, lalu menyatu kembali di jembatan tengah."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="01">{essence.eyebrow}</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-3xl" accent={essence.titleAccent}>
          {essence.title}
        </Display>
      </Reveal>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <Reveal delay={140}>
          <div className="space-y-5 text-white/70">
            {essence.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {[essence.physical, essence.digital].map((side, i) => (
            <Reveal key={side.label} delay={200 + i * 80}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: i === 0 ? "var(--holo-cyan)" : "var(--holo-magenta)" }}
                >
                  {side.label}
                </p>
                <p className="mt-3 text-sm text-white/60">{side.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal delay={320}>
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-7 text-center">
          <p className="text-sm font-semibold tracking-wide" style={{ color: "var(--holo-violet)" }}>
            {essence.bridge.label}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">{essence.bridge.text}</p>
        </div>
      </Reveal>

      <Reveal delay={400}>
        <blockquote className="mt-16 max-w-2xl">
          <p className="holo-display text-2xl sm:text-3xl">
            <span className="holo-gradient-text">{essence.quote.lead}</span>
            <br />
            {essence.quote.accent}
          </p>
        </blockquote>
      </Reveal>
    </Section>
  );
}

/** Scene 03 — Integration. */
export function Integration({ content }: { content: SiteContent }) {
  const { integration } = content;
  return (
    <Section
      id="integration"
      describe="Tiga bidang kaca transparan yang saling bertumpuk terurai menjadi lapisan terpisah lalu menumpuk kembali menjadi satu."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="02">{integration.eyebrow}</Eyebrow>
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

/** Scene 04 — Color Journey. */
export function Colors({ content }: { content: SiteContent }) {
  const { colorJourney } = content;
  const swatch = ["var(--holo-cyan)", "var(--holo-violet)", "var(--holo-magenta)"];
  return (
    <Section
      id="colors"
      describe="Gradasi warna cyan ke violet ke magenta mengalir mengikuti kecepatan scroll, mewakili perjalanan dari Technology ke Creativity ke Experience."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="03">{colorJourney.eyebrow}</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent={colorJourney.titleAccent}>
          {colorJourney.title}
        </Display>
      </Reveal>

      <Reveal delay={140}>
        <p className="mt-6 max-w-xl text-white/70">{colorJourney.lead}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {colorJourney.stops.map((stop, i) => (
          <Reveal key={stop.label} delay={200 + i * 90}>
            <div className="h-full overflow-hidden rounded-2xl border border-white/10">
              <div
                className="h-28"
                style={{
                  background: `linear-gradient(135deg, ${swatch[i]} 0%, transparent 140%)`,
                }}
              />
              <div className="p-6">
                <p className="text-sm font-semibold" style={{ color: swatch[i] }}>
                  {stop.label}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-white/60">
                  {stop.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-white/40">{stop.caption}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/** Scene 05 — Our DNA, lima karakter brand. */
export function Dna() {
  return (
    <Section
      id="dna"
      describe="Lima kartu karakter brand masuk berurutan dari kedalaman, masing-masing dengan cahaya tepi berwarna sendiri."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="04">Our DNA</Eyebrow>
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
