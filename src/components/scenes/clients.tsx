import Image from "next/image";

import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { clients, bestWorks } from "@/content/site";

/** Scene — Our Clients. Diganti dari screenshot compro asli, 8 Okt 2026. */
export function Clients() {
  return (
    <Section
      id="clients"
      describe="Logo puluhan klien dan mitra HOLOLABS, ditata dalam grid."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="05">Our clients</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent="worked with.">
          People we&rsquo;ve
        </Display>
      </Reveal>

      <div className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
        {clients.map((client, i) => (
          <Reveal key={client.name} delay={Math.min(i * 16, 400)}>
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/25">
              <Image
                src={client.src}
                alt={client.name}
                width={160}
                height={120}
                className="h-full w-full object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/** Scene — Our Best Works. Sama sumbernya dengan Clients di atas. */
export function BestWorks() {
  return (
    <Section
      id="best-works"
      describe="Daftar proyek unggulan HOLOLABS bersama logo klien masing-masing."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="06">Our best works</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-2xl" accent="we&rsquo;ve shipped.">
          Experiences
        </Display>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <Reveal delay={140}>
          <ul className="space-y-5">
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
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {bestWorks.map((work) => (
              <div
                key={work.title}
                className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <Image
                  src={work.src}
                  alt={work.client}
                  width={160}
                  height={160}
                  className="h-full w-full object-contain opacity-85"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
