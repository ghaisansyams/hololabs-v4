import Image from "next/image";

import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { bestWorks } from "@/content/site";

/**
 * Scene — Our Best Works.
 *
 * Logos run as an auto-scrolling strip rather than a static grid — with
 * only 9 of them a 3×3 grid of large tiles just sits there "numpuk di
 * tengah" (the client's words), while a marquee keeps them cycling past
 * without ever demanding a click or a hover. Pure CSS (one keyframe
 * looping two back-to-back copies of the list — see globals via the
 * `holo-marquee` class), so there's no JS animation loop competing with
 * the 3D canvas for frame time. Pauses on hover/focus so a name can
 * actually be read, and respects prefers-reduced-motion globally.
 */
export function BestWorks() {
  return (
    <Section
      id="best-works"
      describe="Daftar proyek unggulan HOLOLABS; logo klien terkait berjalan sebagai strip yang bergulir otomatis."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="05">Our best works</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent="we&rsquo;ve shipped.">
          Experiences
        </Display>
      </Reveal>

      <Reveal delay={140}>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2">
          {bestWorks.map((work) => (
            <li key={work.title} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-2 block size-1.5 shrink-0 rounded-full"
                style={{ background: "var(--holo-cyan)" }}
              />
              <p className="text-sm text-white/70 sm:text-base">
                {work.title} <span className="italic text-white/45">({work.client})</span>
              </p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={220}>
        <div className="holo-marquee-mask mt-14 overflow-hidden">
          <div className="holo-marquee flex w-max items-center gap-10 py-4">
            {[...bestWorks, ...bestWorks].map((work, i) => (
              <div
                key={`${work.client}-${i}`}
                className="flex h-20 w-40 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <Image
                  src={work.src}
                  alt={work.client}
                  width={200}
                  height={120}
                  className="max-h-full max-w-full object-contain opacity-85"
                />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
