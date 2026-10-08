"use client";

import { useState } from "react";

import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { solutions } from "@/content/site";

const ACCENTS = [
  "var(--holo-cyan)",
  "var(--holo-blue)",
  "var(--holo-violet)",
  "var(--holo-magenta)",
  "var(--holo-cyan)",
  "var(--holo-violet)",
  "var(--holo-blue)",
  "var(--holo-magenta)",
];

/**
 * Scene 06–09 — delapan area layanan.
 *
 * Kartu yang dibuka memakai <details>, bukan state tersembunyi: isinya tetap
 * ada di HTML sehingga terindeks mesin pencari dan terbaca pembaca layar
 * meski panelnya tertutup.
 */
export function Solutions() {
  const [open, setOpen] = useState<string | null>(solutions[0].key);

  return (
    <Section
      id="solutions"
      describe="Delapan area layanan tersusun sebagai grid dalam ruang tiga dimensi; kartu terangkat saat kursor mendekat."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="03">What we do</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-3xl" accent="Multiple possibilities.">
          One lab.
        </Display>
      </Reveal>

      <Reveal delay={140}>
        <p className="mt-6 max-w-xl text-white/70">
          Masing-masing dapat berdiri sebagai solusi tersendiri atau diintegrasikan menjadi sebuah{" "}
          <span className="holo-gradient-text font-medium">immersive technology experience</span>.
        </p>
      </Reveal>

      <div className="mt-14 space-y-3">
        {solutions.map((solution, i) => {
          const isOpen = open === solution.key;
          return (
            <Reveal key={solution.key} delay={90 + i * 50}>
              <article
                className="overflow-hidden rounded-2xl border transition-colors duration-500"
                style={{
                  borderColor: isOpen ? `color-mix(in srgb, ${ACCENTS[i]} 45%, transparent)` : undefined,
                }}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : solution.key)}
                    aria-expanded={isOpen}
                    aria-controls={`solution-${solution.key}`}
                    className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.04] sm:px-7"
                  >
                    <span className="holo-eyebrow tabular-nums">{solution.no}</span>
                    <span className="flex-1">
                      <span className="holo-display block text-xl sm:text-2xl" style={{ color: ACCENTS[i] }}>
                        {solution.title}
                      </span>
                      <span className="mt-1 block text-sm text-white/55">{solution.headline}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-lg text-white/40 transition-transform duration-500"
                      style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                    >
                      +
                    </span>
                  </button>
                </h3>

                <div
                  id={`solution-${solution.key}`}
                  hidden={!isOpen}
                  className="border-t border-white/10 px-5 pb-7 pt-6 sm:px-7"
                >
                  <p className="max-w-2xl text-sm text-white/65">{solution.lead}</p>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {solution.items.map((item) => (
                      <li key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm font-medium" style={{ color: ACCENTS[i] }}>
                          {item.title}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-white/55">{item.text}</p>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`#contact?solution=${solution.key}`}
                    className="mt-6 inline-block text-sm text-white/70 underline underline-offset-4 transition hover:text-white"
                  >
                    Diskusikan proyek {solution.title} →
                  </a>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
