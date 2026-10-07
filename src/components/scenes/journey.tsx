import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import type { SiteContent } from "@/lib/site-content";
import { ReservationForm } from "@/components/forms/reservation-form";

/** Scene 11 — Experience Journey 90 menit. */
export function Journey({ content }: { content: SiteContent }) {
  const { journey } = content;
  const total = journey.steps.reduce((sum, step) => sum + step.minutes, 0);

  return (
    <Section
      id="journey"
      describe="Jalur melengkung tiga dimensi yang dilalui kamera; tiap tahap Experience Journey muncul sebagai perhentian di sepanjang jalur."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="07">{journey.eyebrow}</Eyebrow>
      </Reveal>

      <Reveal delay={80}>
        <Display className="mt-6 max-w-3xl" accent={journey.titleAccent}>
          {journey.title}
        </Display>
      </Reveal>

      <Reveal delay={140}>
        <p className="mt-6 max-w-xl text-white/70">{journey.lead}</p>
      </Reveal>

      <Reveal delay={200}>
        <p className="holo-display mt-10 text-2xl sm:text-3xl">
          <span className="tabular-nums">{total}</span> menit{" "}
          <span className="holo-gradient-text">exploring what technology can become.</span>
        </p>
      </Reveal>

      <ol className="mt-14 space-y-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        {journey.steps.map((step, i) => (
          <Reveal as="li" key={step.no} delay={100 + i * 60}>
            <div className="bg-[var(--holo-ink)] p-6 sm:flex sm:items-start sm:gap-7">
              <span
                className="holo-display block text-3xl tabular-nums sm:w-16"
                style={{
                  color: [
                    "var(--holo-cyan)",
                    "var(--holo-violet)",
                    "var(--holo-blue)",
                    "var(--holo-magenta)",
                    "var(--holo-cyan)",
                    "var(--holo-violet)",
                  ][i],
                }}
              >
                {step.no}
              </span>
              <div className="mt-3 flex-1 sm:mt-0">
                <h3 className="holo-display text-xl">{step.title}</h3>
                <p className="holo-eyebrow mt-1.5">{step.subtitle}</p>
                <p className="mt-3 max-w-2xl text-sm text-white/60">{step.text}</p>
              </div>
              <span className="mt-3 inline-block shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] tabular-nums text-white/60 sm:mt-1">
                ±{step.minutes} menit
              </span>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={480}>
        <div className="mt-14">
          <h3 className="holo-display text-2xl">Terbuka untuk siapa saja</h3>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {journey.visitorTypes.map((type) => (
              <li
                key={type.key}
                className="rounded-full border border-white/12 px-4 py-2 text-xs text-white/70"
              >
                {type.label}
                <span className="ml-2 text-white/35">{type.size}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={560}>
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-9">
          <h3 className="holo-display text-2xl">Pesan kursi</h3>
          <p className="mt-2 max-w-lg text-sm text-white/60">
            Experience memakai sistem scheduled show dan seat reservation, sehingga jumlah pengunjung
            tiap sesi disesuaikan dengan karakter experience.
          </p>
          <ReservationForm />
        </div>
      </Reveal>
    </Section>
  );
}
