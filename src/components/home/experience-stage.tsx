"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { canvas, drawHolomedis, drawSouvenir, drawTicket } from "@/components/home/stage/art";
import { cn } from "@/lib/utils/cn";

export interface StageStep {
  mood: string;
  title: string;
  description: string;
  minutes: string;
}

export interface StageHero {
  badge: string;
  title: string;
  titleAccent: string;
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  hud: { value: string; label: string }[];
}

const STOPS = 8; // hero + 7 chapters (mirrors stage/engine.ts)

/** What each chapter's 3D effect is about, shown under the title. */
const EFFECT_TAGS = ["QR scan", "Projection mapping", "Audio reactive", "AI hologram", "Voice control", "Layer by layer", "Souvenir"];

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The homepage's centrepiece: a WebGL (three.js) journey. A portal frames
 * the hero; scrolling flies the camera through it and past seven chapters,
 * each with its own 3D effect (see stage/chapters.ts). The 3D code is a
 * separate chunk loaded after first paint. Without WebGL, or with reduced
 * motion, the same chapters appear as a plain illustrated list.
 */
export function ExperienceStage({ hero, steps }: { hero: StageHero; steps: StageStep[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"stage" | "static">("stage");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const count = Math.min(steps.length, STOPS - 1);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !webglAvailable()) setMode("static");
  }, []);

  useEffect(() => {
    if (mode !== "stage") return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvasEl = canvasRef.current;
    if (!section || !stage || !canvasEl) return;
    let disposed = false;
    let dispose = () => {};

    import("@/components/home/stage/engine")
      .then(({ createStage }) => {
        if (disposed) return;
        dispose = createStage({
          canvas: canvasEl,
          stage,
          section,
          count,
          onReady: () => {
            if (!disposed) setReady(true);
          },
          onActive: (i) => {
            if (!disposed) setActive(i);
          },
          onError: (error) => {
            console.error("[3d] scene error, memakai tampilan statis", error);
            if (!disposed) setMode("static");
          },
        });
      })
      .catch((error) => {
        console.error("[3d] gagal memuat scene", error);
        if (!disposed) setMode("static");
      });

    return () => {
      disposed = true;
      dispose();
    };
  }, [mode, count]);

  function jump(index: number) {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const span = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / (STOPS - 1)) * span, behavior: "smooth" });
  }

  if (mode === "static") {
    return <StaticExperience hero={hero} steps={steps.slice(0, count)} />;
  }

  const stepIndex = Math.max(0, active - 1);
  const step = steps[stepIndex];
  const side = stepIndex % 2 === 0 ? "right" : "left";
  const starts = steps.slice(0, count).reduce<number[]>((acc, _st, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (parseInt(steps[i - 1].minutes, 10) || 0));
    return acc;
  }, []);

  return (
    <div ref={sectionRef} id="journey" className="relative" style={{ height: `${100 + (STOPS - 1) * 90}dvh` }}>
      <div ref={stageRef} data-mode="stage" data-ready={ready} className="sticky top-0 h-dvh overflow-hidden bg-[#040208]">
        <canvas
          ref={canvasRef}
          aria-hidden
          className={cn("absolute inset-0 size-full transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(4_2_8/0.8))]" />

        {/* HUD frame */}
        <div aria-hidden className="pointer-events-none absolute inset-3 sm:inset-5">
          <span className="absolute left-0 top-0 size-5 border-l border-t border-cyan/50" />
          <span className="absolute right-0 top-0 size-5 border-r border-t border-cyan/50" />
          <span className="absolute bottom-0 left-0 size-5 border-b border-l border-cyan/50" />
          <span className="absolute bottom-0 right-0 size-5 border-b border-r border-cyan/50" />
        </div>

        {/* Hero copy: inside the portal on wide screens, under it on phones */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-end px-5 pb-24 text-center sm:px-10 lg:justify-center lg:pb-4",
            active === 0 ? "pointer-events-auto" : "pointer-events-none",
          )}
          style={{ opacity: active === 0 ? "var(--o, 1)" : 0 }}
        >
          <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-cyan sm:text-xs">{hero.badge}</p>
          <h1 className="mt-4 max-w-[17ch] text-[1.75rem] font-semibold leading-[1.12] text-ink sm:text-5xl lg:max-w-[16ch] lg:text-[3.35rem]">
            {hero.title}{" "}
            <span className="bg-gradient-to-r from-cyan via-[#818cf8] to-[#e879f9] bg-clip-text text-transparent">{hero.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-ink-soft sm:text-base">{hero.lead}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pesan" className={buttonStyles({ size: "lg" })}>
              {hero.ctaPrimary}
            </Link>
            <button type="button" onClick={() => jump(1)} className={buttonStyles({ variant: "secondary", size: "lg" })}>
              {hero.ctaSecondary}
            </button>
          </div>
        </div>

        {/* Hero readouts */}
        <dl
          className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto hidden max-w-4xl grid-cols-4 gap-px px-10 font-mono sm:grid"
          style={{ opacity: active === 0 ? "var(--o, 1)" : 0 }}
        >
          {hero.hud.map((item, i) => (
            <div key={i} className="border-l border-cyan/30 pl-4 text-left">
              <dd className="text-sm font-medium text-ink">{item.value}</dd>
              <dt className="text-[0.625rem] uppercase tracking-[0.16em] text-muted">{item.label}</dt>
            </div>
          ))}
        </dl>

        {/* Chapter copy */}
        {active > 0 && step ? (
          <div
            key={active}
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-24 pt-24 sm:px-10",
              "bg-gradient-to-t from-[#040208] via-[#040208]/85 to-transparent lg:top-0 lg:flex lg:h-full lg:w-[42%] lg:items-center lg:bg-none lg:p-0",
              side === "right" ? "lg:left-auto lg:right-0 lg:pr-20" : "lg:left-0 lg:pl-20",
            )}
            style={{ opacity: "var(--o, 0)" }}
          >
            <div className="max-w-md">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-cyan">
                CH.{String(active).padStart(2, "0")} / {String(count).padStart(2, "0")}
                <span aria-hidden className="mx-2 text-muted">{"//"}</span>
                <span className="text-ink-soft">{step.mood}</span>
              </p>
              <h2 className="mt-4 text-2xl font-semibold leading-[1.15] text-ink sm:text-3xl lg:text-[2.6rem]">{step.title}</h2>
              <p className="mt-4 text-base leading-8 text-ink-soft">{step.description}</p>
              <p className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.12em]">
                <span className="rounded-md border border-cyan/30 bg-cyan-soft/60 px-3 py-1.5 text-cyan">
                  T+{String(starts[stepIndex] ?? 0).padStart(2, "0")}&apos;{step.minutes ? ` · ${step.minutes}` : ""}
                </span>
                <span className="rounded-md border border-line px-3 py-1.5 text-ink-soft">{EFFECT_TAGS[stepIndex % EFFECT_TAGS.length]}</span>
              </p>
            </div>
          </div>
        ) : null}

        {/* Chapter timeline */}
        <nav
          aria-label="Babak journey"
          className={cn(
            "absolute inset-x-0 bottom-5 mx-auto max-w-4xl px-6 transition-opacity duration-500 sm:bottom-7 sm:px-10",
            active === 0 ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <ol className="grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: "0.375rem" }}>
            {steps.slice(0, count).map((st, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => jump(i + 1)}
                  aria-label={`Babak ${i + 1}: ${st.title}`}
                  aria-current={i + 1 === active ? "true" : undefined}
                  className="group block w-full py-2 text-left"
                >
                  <span className="block h-[3px] overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full origin-left bg-gradient-to-r from-cyan to-[#a855f7]"
                      style={{ transform: `scaleX(clamp(0, calc(var(--t, 0) - ${i}), 1))` }}
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 block font-mono text-[0.625rem] uppercase tracking-[0.12em] transition-colors",
                      i + 1 === active ? "text-cyan" : "text-muted group-hover:text-ink-soft",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                    <span className="hidden lg:inline"> {st.mood}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <ol className="sr-only">
        {steps.slice(0, count).map((st, i) => (
          <li key={i}>
            {st.mood}: {st.title}. {st.description} {st.minutes}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Draws one of the canvas artworks once, for the fallback list. */
function CanvasArt({ kind }: { kind: "ticket" | "holomedis" | "souvenir" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const [c, g] = kind === "ticket" ? canvas(800, 640) : kind === "holomedis" ? canvas(1024, 768) : canvas(900, 560);
    if (kind === "ticket") drawTicket(g);
    else if (kind === "holomedis") drawHolomedis(g, 6, true);
    else drawSouvenir(g);
    c.className = "max-h-full max-w-full";
    host.replaceChildren(c);
  }, [kind]);
  return <div ref={ref} className="flex size-full items-center justify-center bg-[#0a0716] p-4" />;
}

const STATIC_VISUALS: ({ art: "ticket" | "holomedis" | "souvenir" } | { src: string; position: string })[] = [
  { art: "ticket" },
  { src: "/experience/journey-of-life.jpg", position: "50% 40%" },
  { src: "/experience/dj.jpg", position: "50% 40%" },
  { art: "holomedis" },
  { src: "/experience/smarthome.jpg", position: "50% 40%" },
  { src: "/experience/print3d.jpg", position: "60% 50%" },
  { art: "souvenir" },
];

/** Fallback with no WebGL or motion: the same chapters as a plain illustrated list. */
function StaticExperience({ hero, steps }: { hero: StageHero; steps: StageStep[] }) {
  return (
    <div id="journey" data-mode="static">
      <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-28 text-center sm:px-10">
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 size-[min(80vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/40 shadow-[0_0_80px_rgb(124_58_237/0.35)]"
        />
        <div className="relative max-w-2xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.26em] text-cyan">{hero.badge}</p>
          <h1 className="mt-5 text-3xl font-semibold leading-[1.12] text-ink sm:text-5xl">
            {hero.title}{" "}
            <span className="bg-gradient-to-r from-cyan via-[#818cf8] to-[#e879f9] bg-clip-text text-transparent">{hero.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-8 text-ink-soft">{hero.lead}</p>
          <Link href="/pesan" className={buttonStyles({ size: "lg", className: "mt-8" })}>
            {hero.ctaPrimary}
          </Link>
        </div>
      </section>
      <ol className="mx-auto max-w-5xl space-y-16 px-5 py-16 sm:px-10">
        {steps.map((s, i) => {
          const v = STATIC_VISUALS[i % STATIC_VISUALS.length];
          return (
            <li key={i} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-xl border border-line", i % 2 === 1 && "md:order-2")}>
                {"art" in v ? (
                  <CanvasArt kind={v.art} />
                ) : (
                  <Image src={v.src} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" style={{ objectPosition: v.position }} />
                )}
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                  CH.{String(i + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")} <span className="text-ink-soft">{s.mood}</span>
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">{s.title}</h2>
                <p className="mt-4 text-base leading-8 text-ink-soft">{s.description}</p>
                {s.minutes ? <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">{s.minutes}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
