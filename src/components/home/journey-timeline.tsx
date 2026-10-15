"use client";

import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import { cn } from "@/lib/utils/cn";

export interface TimelineStep {
  title: string;
  subtitle: string;
  minutes: string;
  description: string;
}

const NUMBER_COLORS = ["text-accent", "text-brand-ink", "text-[#818cf8]", "text-[#e879f9]"];

/**
 * The show's stages on a vertical rail. As the page scrolls, the rail fills
 * from the top and each stage's dot lights up once it passes the reading
 * line (60% down the viewport). Both are written straight to the DOM from
 * one rAF-throttled scroll handler, so scrolling never re-renders React.
 * On wide screens the cards alternate sides of the rail.
 */
export function JourneyTimeline({ steps }: { steps: TimelineStep[] }) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.6;
      const rect = list.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (line - rect.top) / rect.height));
      list.style.setProperty("--timeline-progress", progress.toFixed(4));
      for (const item of list.querySelectorAll<HTMLElement>("[data-step]")) {
        const top = item.getBoundingClientRect().top;
        item.dataset.active = top < line ? "true" : "false";
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ol ref={listRef} className="relative mt-14">
      {/* Rail: a dim track with a gradient fill that follows the scroll. */}
      <span aria-hidden className="absolute bottom-4 left-[1.125rem] top-4 w-px bg-line lg:left-1/2 lg:-translate-x-1/2" />
      <span
        aria-hidden
        className="timeline-fill absolute bottom-4 left-[1.125rem] top-4 w-px bg-gradient-to-b from-accent via-brand to-[#e879f9] lg:left-1/2 lg:-translate-x-1/2"
      />

      {steps.map((step, index) => {
        const right = index % 2 === 1;
        const no = String(index + 1).padStart(2, "0");
        return (
          <li
            key={index}
            data-step
            data-active="false"
            className="relative grid pb-8 pl-12 last:pb-0 lg:grid-cols-2 lg:gap-16 lg:pb-0 lg:pl-0 lg:[&:not(:first-child)]:-mt-10"
          >
            <span
              aria-hidden
              className="timeline-dot absolute left-[1.125rem] top-7 z-10 size-3.5 -translate-x-1/2 rounded-full border-2 border-canvas bg-line lg:left-1/2"
            />
            <Reveal
              variant={right ? "right" : "left"}
              className={cn(right ? "lg:col-start-2" : "lg:col-start-1 lg:text-right")}
            >
              <TiltCard max={6}>
                <div className="rounded-card border border-line bg-surface p-5 transition-colors duration-300 hover:border-accent/40 sm:p-6">
                  <div className={cn("flex items-start justify-between gap-4", !right && "lg:flex-row-reverse")}>
                    <span
                      className={cn(
                        "font-display text-4xl font-extrabold leading-none tabular-nums sm:text-5xl",
                        NUMBER_COLORS[index % NUMBER_COLORS.length],
                      )}
                    >
                      {no}
                    </span>
                    {step.minutes ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-line px-3 py-1 text-xs font-semibold tabular-nums text-ink-soft">
                        <Clock className="size-3" aria-hidden />±{step.minutes} menit
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-ink sm:text-xl">{step.title}</h3>
                  {step.subtitle ? (
                    <p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-brand">
                      {step.subtitle}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              </TiltCard>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
