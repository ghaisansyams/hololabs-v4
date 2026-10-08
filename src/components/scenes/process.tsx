import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { SiteContent } from "@/lib/site-content";

/** Scene 12 — How we work, why HOLOLABS, vision, dan manifesto penutup. */
export function Process({ content }: { content: SiteContent }) {
  const { process } = content;
  return (
    <Section
      id="process"
      describe="Enam tahap kerja tersusun pada garis vertikal berkelok yang terisi seiring scroll, lalu tiga lingkaran Human, Technology, dan Space menyatu di tengah."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="07">{process.eyebrow}</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent={process.titleAccent}>
          {process.title}
        </Display>
      </Reveal>

      <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {process.steps.map((step, i) => (
          <Reveal as="li" key={step.no} delay={110 + i * 60}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="holo-eyebrow tabular-nums">{step.no}</span>
              <p className="holo-display mt-3 text-xl">{step.title}</p>
              <p className="mt-2 text-xs tracking-wide text-white/50">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={420}>
        <div className="mt-20">
          <h3 className="holo-display text-3xl sm:text-4xl">{process.why.title}</h3>
          <p className="mt-4 max-w-xl text-white/60">{process.why.lead}</p>
          <ul className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2.5 text-sm">
            {process.why.mix.map((item, i) => (
              <li key={item} className="flex items-center gap-3">
                <span className="rounded-full border border-white/15 px-4 py-1.5 text-white/75">
                  {item}
                </span>
                {i < process.why.mix.length - 1 ? (
                  <span aria-hidden="true" className="text-white/25">
                    ×
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={500}>
        <div className="mt-20 border-t border-white/10 pt-14">
          <Eyebrow index="08">{process.vision.eyebrow}</Eyebrow>
          <Display className="mt-6 max-w-2xl" accent={process.vision.titleAccent}>
            {process.vision.title}
          </Display>
          <div className="mt-7 max-w-xl space-y-4 text-white/70">
            {process.vision.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2">
            {process.vision.formula.map((item, i) => (
              <li key={item} className="flex items-center gap-4">
                <span className="holo-display text-lg tracking-[0.2em]">{item.toUpperCase()}</span>
                {i < process.vision.formula.length - 1 ? (
                  <span aria-hidden="true" className="text-white/25">
                    ×
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={580}>
        <div className="mt-20 rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center sm:p-14">
          <p className="holo-display text-3xl sm:text-5xl">
            {process.manifesto.lead}
            <br />
            <span className="holo-gradient-text">{process.manifesto.accent}</span>
          </p>
          <ul className="mt-9 space-y-1.5 text-sm text-white/55">
            {process.manifesto.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}
