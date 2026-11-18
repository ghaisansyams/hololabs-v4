"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils/cn";

export interface Phase {
  title: string;
  time: string;
  description: string;
  tags: string[];
}

/**
 * Four abstract light compositions, one per phase of the visit. They are
 * drawn, not photographed: no real venue photography exists yet, and these
 * keep the page from reusing the banner render.
 */
function Scene({ index }: { index: number }) {
  const kind = index % 4;
  const id = `amb${useId().replace(/:/g, "")}`;

  return (
    <svg viewBox="0 0 400 500" className="size-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0814" />
          <stop offset="1" stopColor="#1e1430" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9d5ff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-orb`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#e9d5ff" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${id}-bg)`} />

      {kind === 0 ? (
        <g>
          <polygon points="150,120 250,120 400,500 0,500" fill={`url(#${id}-beam)`} opacity="0.5" className="amb-pop" />
          <rect x="160" y="110" width="80" height="170" rx="6" fill="#f5eaff" className="amb-pop" />
          <rect x="160" y="110" width="80" height="170" rx="6" fill="none" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="200" cy="360" r="9" fill="#05030a" />
          <rect x="190" y="372" width="20" height="58" rx="8" fill="#05030a" />
          <ellipse cx="200" cy="438" rx="44" ry="7" fill="#a855f7" opacity="0.35" />
        </g>
      ) : null}

      {kind === 1 ? (
        <g>
          <circle cx="200" cy="190" r="120" fill={`url(#${id}-orb)`} className="amb-pop" />
          <circle cx="200" cy="190" r="46" fill="#fff" opacity="0.95" />
          <rect x="0" y="270" width="400" height="230" fill="#0a0613" opacity="0.7" />
          <line x1="0" y1="270" x2="400" y2="270" stroke="#c084fc" strokeWidth="1.5" />
          <g className="amb-pop" opacity="0.55">
            <ellipse cx="200" cy="350" rx="120" ry="24" fill={`url(#${id}-orb)`} />
            <ellipse cx="200" cy="350" rx="46" ry="9" fill="#fff" opacity="0.7" />
          </g>
          <ellipse cx="200" cy="400" rx="150" ry="10" fill="none" stroke="#a855f7" strokeOpacity="0.4" />
          <ellipse cx="200" cy="440" rx="190" ry="14" fill="none" stroke="#a855f7" strokeOpacity="0.25" />
        </g>
      ) : null}

      {kind === 2 ? (
        <g>
          {Array.from({ length: 7 }, (_, i) => {
            const size = 250 - i * 30;
            return (
              <rect
                key={i}
                className="amb-turn"
                style={{ "--i": i } as React.CSSProperties}
                x={200 - size / 2}
                y={250 - size / 2}
                width={size}
                height={size}
                rx={10 + i * 3}
                fill="none"
                stroke={`url(#${id}-stroke)`}
                strokeWidth="1.5"
                strokeOpacity={1 - i * 0.09}
              />
            );
          })}
          <circle cx="200" cy="250" r="14" fill="#f5eaff" className="amb-pop" />
        </g>
      ) : null}

      {kind === 3 ? (
        <g>
          {[40, 80, 120, 160].map((r, i) => (
            <circle
              key={r}
              className="amb-pop"
              cx="200"
              cy="250"
              r={r}
              fill="none"
              stroke="#c084fc"
              strokeOpacity={0.8 - i * 0.17}
              style={{ transitionDelay: `${i * 90}ms` }}
            />
          ))}
          <circle cx="200" cy="250" r="12" fill="#f5eaff" />
          {[
            [88, 190],
            [304, 214],
            [250, 372],
            [120, 330],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <line x1="200" y1="250" x2={x} y2={y} stroke="#a855f7" strokeOpacity="0.5" />
              <circle cx={x} cy={y} r="7" fill="#38bdf8" />
            </g>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

/**
 * The visit as a scroll story. On wide screens the scene stays pinned on
 * the left while the phases scroll past on the right; the scene changes
 * when a phase crosses the middle of the viewport. On phones each phase
 * carries its own scene above its text.
 */
export function AmbiancePhases({ eyebrow, title, phases }: { eyebrow: string; title: string; phases: Phase[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const node of refs.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [phases.length]);

  const current = phases[active] ?? phases[0];

  return (
    <div className="container-gutter mx-auto w-full max-w-7xl">
      <div className="max-w-2xl">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        </Reveal>
        <Reveal delay={70}>
          <h2 className="mt-3 text-3xl text-ink sm:text-4xl">{title}</h2>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <div className="relative aspect-[4/5] max-h-[calc(100dvh-10rem)] overflow-hidden rounded-card border border-line">
              {phases.map((_, i) => (
                <div key={i} data-on={i === active ? "true" : "false"} className="amb-scene-item absolute inset-0">
                  <Scene index={i} />
                </div>
              ))}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas-deep/90 to-transparent px-6 pb-5 pt-16"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{current?.time}</p>
                <p className="mt-1 text-lg font-bold text-ink">{current?.title}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2" aria-hidden>
              {phases.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-500",
                    i <= active ? "bg-accent" : "bg-line",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <ol className="flex flex-col gap-14 lg:gap-0">
          {phases.map((phase, i) => (
            <li
              key={i}
              data-index={i}
              ref={(node) => {
                refs.current[i] = node;
              }}
              className="flex flex-col justify-center lg:min-h-[78dvh]"
            >
              <div
                data-on="true"
                className="relative mb-6 aspect-square max-w-md overflow-hidden rounded-card border border-line lg:hidden"
              >
                <Scene index={i} />
              </div>
              <p className="text-sm font-semibold text-muted">
                <span className="text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span aria-hidden> / </span>
                <span className="sr-only"> dari </span>
                {String(phases.length).padStart(2, "0")}
                <span aria-hidden className="mx-3 inline-block h-px w-8 bg-line align-middle" />
                {phase.time}
              </p>
              <h3 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{phase.title}</h3>
              <p className="mt-4 max-w-md text-base leading-8 text-ink-soft">{phase.description}</p>
              {phase.tags.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {phase.tags.slice(0, 3).map((tag, t) => (
                    <li key={t} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink-soft">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
