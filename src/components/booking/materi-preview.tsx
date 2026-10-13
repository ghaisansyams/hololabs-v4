import { Bot, Disc3, Home, Printer, Projector, Sparkles, type LucideIcon } from "lucide-react";
import { getSiteContent } from "@/lib/cms";

const STAGE_ICONS: LucideIcon[] = [Projector, Disc3, Bot, Home, Printer, Sparkles];

/**
 * A compact "what's inside the show" teaser on /pesan — each stage of the
 * Experience Journey with a dummy abstract tech visual (no photography
 * asset library is wired up yet, so this is a generated gradient + grid
 * pattern per stage rather than a real photo).
 */
export async function MateriPreview() {
  const { journey } = await getSiteContent();
  const stages = journey.steps.slice(0, 6);
  if (stages.length === 0) return null;

  return (
    <section className="mb-8 rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-accent">Apa yang akan kamu alami</h2>
      <p className="mt-1 text-sm text-muted">Enam tahap dalam satu show, {journey.durationLabel}.</p>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {stages.map((step, index) => {
          const Icon = STAGE_ICONS[index % STAGE_ICONS.length];
          return (
            <div key={index} className="w-40 shrink-0 overflow-hidden rounded-2xl border border-line bg-canvas-deep">
              {/* Dummy tech visual: gradient + grid pattern, standing in for a photo of the zone. */}
              <div
                aria-hidden
                className="relative flex h-24 items-center justify-center overflow-hidden"
                style={{
                  backgroundImage: [
                    "linear-gradient(135deg, rgb(168 85 247 / 0.35), rgb(34 211 238 / 0.25))",
                    "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
                  ].join(", "),
                  backgroundSize: "100% 100%, 14px 14px, 14px 14px",
                }}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-canvas shadow-glow">
                  <Icon className="size-5" aria-hidden />
                </span>
              </div>
              <div className="p-3">
                <p className="text-[0.625rem] font-bold uppercase tracking-wide text-brand">
                  {String(index + 1).padStart(2, "0")} · ±{step.minutes} menit
                </p>
                <p className="mt-1 text-xs font-bold leading-tight text-ink">{step.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
