import { Display, Eyebrow, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { PickPackageButton } from "@/components/forms/pick-package-button";
import { showPackages, showSchedule } from "@/content/site";
import { formatDate, formatRupiah, formatWeekday } from "@/lib/format";

function Check() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="var(--holo-cyan)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}

/**
 * Scene 06 — Jadwal show dan paket F&B. Isi dan harga disamakan dengan
 * hololabs-id; tampilannya mengikuti bahasa visual hololabs-web. Sisa kursi
 * sengaja tidak ditampilkan di sini — halaman ini di-cache, jadi angka itu
 * hanya ada di form pemesanan yang membacanya langsung dari basis data.
 */
export function Schedule() {
  return (
    <Section
      id="jadwal"
      describe="Jadwal lima hari dengan dua show per hari, diikuti tiga paket F&B beserta harga per kursi."
      className="py-28 sm:py-36"
    >
      <Reveal>
        <Eyebrow index="06">{showSchedule.eyebrow}</Eyebrow>
      </Reveal>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <Reveal delay={80}>
          <Display className="max-w-2xl" accent={showSchedule.titleAccent}>
            {showSchedule.title}
          </Display>
          <p className="mt-6 max-w-xl text-white/70">{showSchedule.lead}</p>
        </Reveal>
        <Reveal delay={140}>
          <a
            href="#pesan"
            className="inline-block shrink-0 rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/85 transition hover:border-white/50 hover:text-white"
          >
            {showSchedule.cta} →
          </a>
        </Reveal>
      </div>

      <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {showSchedule.dates.map((date, i) => (
          <Reveal as="li" key={date} delay={160 + i * 60}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="holo-eyebrow" style={{ color: i % 2 ? "var(--holo-magenta)" : "var(--holo-cyan)" }}>
                {formatWeekday(date)}
              </p>
              <p className="mt-2 text-sm text-white/85">{formatDate(date)}</p>
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {showSchedule.slots.map((slot) => (
                  <li key={slot.label} className="flex items-center justify-between text-xs text-white/60">
                    <span className="text-white/35">{slot.label}</span>
                    <span className="tabular-nums">{slot.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ol>

      <div className="mt-28">
        <Reveal>
          <Eyebrow>{showPackages.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h3 className="holo-display mt-6 max-w-2xl text-3xl sm:text-4xl">{showPackages.title}</h3>
          <p className="mt-4 max-w-xl text-white/70">{showPackages.lead}</p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {showPackages.items.map((pkg, i) => {
            const featured = pkg.id === showPackages.featured;
            const card = (
              <div className="flex h-full flex-col rounded-2xl bg-[var(--holo-ink)] p-7">
                {featured ? (
                  <span
                    className="mb-4 inline-block w-fit rounded-full px-3 py-1 text-[11px] font-medium text-[var(--holo-ink)]"
                    style={{ background: "var(--holo-gradient)" }}
                  >
                    {showPackages.featuredBadge}
                  </span>
                ) : null}
                <p className="holo-display text-xl">{pkg.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{pkg.description}</p>
                <p className="holo-display mt-6 text-3xl tabular-nums">
                  {formatRupiah(pkg.price)}
                  <span className="ml-1.5 text-sm text-white/45">/ kursi</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-white/75">
                  {pkg.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <Check />
                      {line}
                    </li>
                  ))}
                </ul>
                <PickPackageButton packageId={pkg.id} featured={featured}>
                  Pilih {pkg.name}
                </PickPackageButton>
              </div>
            );

            return (
              <Reveal key={pkg.id} delay={120 + i * 90}>
                {featured ? (
                  // Bingkai gradien 1px: lapisan luar bergradien, kartu di dalamnya
                  // menutup semuanya kecuali tepinya.
                  <div
                    className="h-full rounded-2xl p-px"
                    style={{
                      background: "var(--holo-gradient)",
                      boxShadow: "0 0 48px -12px color-mix(in srgb, var(--holo-magenta) 55%, transparent)",
                    }}
                  >
                    {card}
                  </div>
                ) : (
                  <div className="h-full rounded-2xl border border-white/10">{card}</div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
