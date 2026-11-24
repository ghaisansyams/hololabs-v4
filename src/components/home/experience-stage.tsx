"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight, Clock3, Disc3, Flag, Gift, House, Info, LogIn, Printer, Projector, Stethoscope, Ticket, X, type LucideIcon } from "lucide-react";
import { canvas, drawHolomedis, drawSouvenir, drawTicket } from "@/components/home/stage/art";
import { cn } from "@/lib/utils/cn";

export interface StageStep {
  mood: string;
  title: string;
  description: string;
  minutes: string;
  flow?: string[];
  /** CMS photo of the chapter; "" or missing = the built-in one. */
  image?: string;
}

/** One icon per chapter, in order: ticket, projector, DJ deck, doctor, home, printer, gift. */
const CHAPTER_ICONS: LucideIcon[] = [Ticket, Projector, Disc3, Stethoscope, House, Printer, Gift];

/**
 * The first and last chapters are the arrival and the send-off, not show acts,
 * so the timeline gives them their own names and a START / END marker instead
 * of a number. The acts in between are numbered from 1.
 */
const TIMELINE_ENDS = {
  start: { label: "Registrasi", tag: "Mulai", Icon: LogIn },
  end: { label: "Penutup", tag: "Selesai", Icon: Flag },
} as const;

const MAX_CHAPTERS = 7; // one per chapter factory in stage/chapters.ts

/** "±15 menit" -> 15, for the running clock (T+mm') on each chapter. */
const minutesOf = (m: string) => parseInt(m.replace(/[^0-9]/g, ""), 10) || 0;

/** Start/end chapters get their own name; acts in between are numbered from 1. */
function chapterLabel(i: number, count: number) {
  if (count > 2 && i === 0) return { edge: TIMELINE_ENDS.start, num: null };
  if (count > 2 && i === count - 1) return { edge: TIMELINE_ENDS.end, num: null };
  return { edge: null, num: count > 2 ? i : i + 1 };
}

/** The guest's path through a chapter: numbered steps joined by a glowing line. */
function FlowSteps({ flow, vertical = false }: { flow: string[]; vertical?: boolean }) {
  if (flow.length === 0) return null;
  if (vertical) {
    return (
      <ol className="relative space-y-3 pl-1">
        <span aria-hidden className="absolute bottom-3 left-[0.9rem] top-3 w-px bg-gradient-to-b from-cyan/70 via-[#a78bfa]/60 to-[#e879f9]/50" />
        {flow.map((f, i) => (
          <li key={i} className="relative flex items-center gap-3">
            <span className="flow-dot relative flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[0.625rem] font-bold text-[#0a0716]">{i + 1}</span>
            <span className="text-[0.9375rem] font-medium text-ink">{f}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {flow.map((f, i) => (
        <li key={i} className="flex items-center gap-1">
          <span className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] py-1 pl-1 pr-2.5 text-xs font-medium text-ink">
            <span className="flow-dot flex size-[1.125rem] items-center justify-center rounded-full font-mono text-[0.5625rem] font-bold text-[#0a0716]">{i + 1}</span>
            {f}
          </span>
          {i < flow.length - 1 ? <ChevronRight aria-hidden className="size-3.5 text-cyan/70" /> : null}
        </li>
      ))}
    </ol>
  );
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The journey under the photo hero: a WebGL (three.js) scene pinned while
 * the page scrolls, flying the camera past the seven chapters, each with its
 * own 3D effect (see stage/chapters.ts), between glowing LED walls like the
 * hall in the hero photo. The 3D code is a separate chunk loaded after first
 * paint. Without WebGL, or with reduced motion, the same chapters appear as
 * a plain illustrated list.
 */
export function ExperienceStage({ steps }: { steps: StageStep[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"stage" | "static">("stage");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const count = Math.min(steps.length, MAX_CHAPTERS);
  // the chapter photos, joined so the effect below depends on their values, not on the array identity
  const imageKey = steps.map((st) => st.image ?? "").join("|");

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
          images: imageKey.split("|"),
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
  }, [mode, count, imageKey]);

  useEffect(() => {
    if (!detailOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailOpen]);

  /**
   * A hard stop at the last chapter. A fast swipe (a phone flick, a trackpad
   * fling) would otherwise carry straight through the Finale into the next
   * section. When the scroll crosses the end of the journey at speed, it is
   * pulled back to rest on the Finale and the leftover momentum is swallowed;
   * the next gesture then passes normally. A slow scroll is never held.
   */
  useEffect(() => {
    if (mode !== "stage") return;
    const section = sectionRef.current;
    if (!section) return;
    const root = document.documentElement;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let armed = true;
    let timer = 0;
    let bypassUntil = 0;

    const release = () => {
      root.style.overflow = "";
      armed = false; // the next gesture is allowed through
    };

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const vh = window.innerHeight;
      const rect = section.getBoundingClientRect();
      const over = vh - rect.bottom; // > 0 once the camera has left the last stop
      const speed = Math.abs(y - lastY) / Math.max(1, now - lastT);
      const fast = speed > 1.2 || Math.abs(y - lastY) > vh * 0.6;
      if (rect.bottom > vh * 1.25) armed = true; // back up inside the journey: stop again next time

      if (now > bypassUntil && armed && over > 1 && y > lastY && (fast || timer)) {
        window.scrollTo({ top: y - over, behavior: "instant" });
        root.style.overflow = "hidden"; // ends a touch fling that scrollTo alone may not
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          timer = 0;
          release();
        }, 450);
        lastY = y - over;
      } else {
        lastY = y;
      }
      lastT = now;
    };

    // a menu link (Tentang, FAQ ...) scrolls on purpose past the journey: let it through
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("a[href]")) bypassUntil = performance.now() + 2500;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(timer);
      root.style.overflow = "";
    };
  }, [mode]);

  function jump(index: number) {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const span = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / Math.max(1, count - 1)) * span, behavior: "smooth" });
  }

  if (mode === "static") {
    return <StaticExperience steps={steps.slice(0, count)} />;
  }

  const stepIndex = Math.min(Math.max(0, active), count - 1);
  const step = steps[stepIndex];
  const starts = steps.slice(0, count).reduce<number[]>((acc, _st, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + minutesOf(steps[i - 1].minutes));
    return acc;
  }, []);

  return (
    <div ref={sectionRef} id="journey" className="relative" style={{ height: `${100 + (count - 1) * 90}dvh` }}>
      <div ref={stageRef} data-mode="stage" data-ready={ready} className="sticky top-0 h-dvh overflow-hidden bg-[#0a0618]">
        <canvas
          ref={canvasRef}
          aria-hidden
          className={cn("absolute inset-0 size-full transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}
        />

        {/* Chapter copy: name, what it is, and on wide screens a glass card with the story and the guest's flow */}
        {step
          ? (() => {
              const { edge, num } = chapterLabel(stepIndex, count);
              const flow = step.flow ?? [];
              const acts = count > 2 ? count - 2 : count;
              return (
                <div
                  key={active}
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-40 pt-24 sm:px-10",
                    "bg-gradient-to-t from-[#0a0618] via-[#0a0618]/85 to-transparent lg:top-0 lg:flex lg:h-full lg:w-[44%] lg:items-center lg:bg-none lg:p-0 lg:pb-32",
                    // the 3D panel is always on the right, so the text is always on the left
                    "lg:left-0 lg:pl-16",
                  )}
                  style={{ opacity: "var(--o, 0)" }}
                >
                  <div className="max-w-[30rem]">
                    <p className="flex flex-wrap items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em]">
                      <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-cyan">
                        {edge ? edge.tag : `Babak ${String(num).padStart(2, "0")} / ${String(acts).padStart(2, "0")}`}
                      </span>
                      {step.minutes ? (
                        <span className="flex items-center gap-1.5 text-ink-soft">
                          <Clock3 aria-hidden className="size-3.5 text-cyan/80" />
                          {step.minutes}
                          <span className="text-muted">· T+{String(starts[stepIndex] ?? 0).padStart(2, "0")}&apos;</span>
                        </span>
                      ) : null}
                    </p>
                    <h2 className="jc-h2 mt-4 font-display text-[1.65rem] font-semibold uppercase leading-[1.08] text-ink sm:text-4xl lg:text-[2.75rem]">
                      {edge ? edge.label : step.mood}
                    </h2>
                    <p className="mt-2 bg-gradient-to-r from-cyan via-[#a5b4fc] to-[#f0abfc] bg-clip-text text-sm font-semibold text-transparent sm:text-base">
                      {step.title}
                    </p>

                    {/* wide screens: the full story in a glass card */}
                    <div className="journey-card jc-card mt-5 hidden rounded-2xl border border-white/10 p-5 lg:block">
                      <p className="jc-desc text-[0.9375rem] leading-7 text-ink-soft">{step.description}</p>
                      {flow.length > 0 ? (
                        <div className="jc-flow mt-4 border-t border-white/10 pt-4">
                          <p className="mb-2.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">Yang kamu alami</p>
                          <FlowSteps flow={flow} />
                        </div>
                      ) : null}
                    </div>

                    {/* phones and tablets: two lines of the story, the rest in a sheet */}
                    <div className="lg:hidden">
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-soft">{step.description}</p>
                      <button
                        type="button"
                        onClick={() => setDetailOpen(true)}
                        className="pointer-events-auto mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-cyan/40 bg-[#07041a]/80 px-4 text-xs font-semibold text-cyan backdrop-blur-sm"
                      >
                        <Info aria-hidden className="size-3.5" />
                        Lihat detail babak
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          : null}

        {/* Detail sheet for phones and tablets */}
        {detailOpen && step ? (
          <div className="absolute inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="journey-detail-title">
            <button type="button" aria-label="Tutup detail" onClick={() => setDetailOpen(false)} className="absolute inset-0 bg-[#040208]/70 backdrop-blur-[2px]" />
            <div className="journey-sheet absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-3xl border-t border-white/12 px-5 pb-8 pt-3 sm:px-8">
              <span aria-hidden className="mx-auto mb-4 block h-1 w-10 rounded-full bg-white/20" />
              {(() => {
                const { edge, num } = chapterLabel(stepIndex, count);
                const flow = step.flow ?? [];
                const acts = count > 2 ? count - 2 : count;
                return (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cyan">
                        {edge ? edge.tag : `Babak ${String(num).padStart(2, "0")} / ${String(acts).padStart(2, "0")}`}
                        {step.minutes ? <span className="text-ink-soft"> · {step.minutes}</span> : null}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDetailOpen(false)}
                        aria-label="Tutup detail"
                        className="-mr-2 -mt-2 flex size-10 shrink-0 items-center justify-center rounded-full text-ink-soft hover:text-ink"
                      >
                        <X className="size-5" aria-hidden />
                      </button>
                    </div>
                    <h3 id="journey-detail-title" className="mt-1 font-display text-2xl font-semibold uppercase leading-tight text-ink">
                      {edge ? edge.label : step.mood}
                    </h3>
                    <p className="mt-1.5 bg-gradient-to-r from-cyan via-[#a5b4fc] to-[#f0abfc] bg-clip-text text-sm font-semibold text-transparent">{step.title}</p>
                    <p className="mt-4 text-[0.9375rem] leading-7 text-ink-soft">{step.description}</p>
                    {flow.length > 0 ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">Yang kamu alami</p>
                        <FlowSteps flow={flow} vertical />
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}

        {/* Chapter timeline: a tilted glass dock, glossy spheres on a glowing tube */}
        <nav aria-label="Babak journey" className="absolute inset-x-0 bottom-4 mx-auto max-w-4xl px-4 [perspective:1100px] sm:bottom-7 sm:px-10">
          <div className="tl-dock rounded-[1.75rem] border border-white/10 px-3 pb-3 pt-5 backdrop-blur-xl [transform-origin:50%_100%] [transform:rotateX(9deg)] sm:px-6 sm:pb-4 sm:pt-9">
            <div className="relative">
              {/* tube between the first and last sphere, filled as the page scrolls */}
              <div
                aria-hidden
                className="tl-tube absolute top-3.5 h-2 -translate-y-1/2 rounded-full sm:top-[1.375rem]"
                style={{ left: `${50 / count}%`, right: `${50 / count}%` }}
              >
                <span
                  className="tl-fill block h-full origin-left rounded-full"
                  style={{ transform: `scaleX(clamp(0, calc(var(--t, 0) / ${Math.max(1, count - 1)}), 1))` }}
                />
              </div>
              <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
                {steps.slice(0, count).map((st, i) => {
                  const done = i < stepIndex;
                  const current = i === stepIndex;
                  const edge = count > 2 ? (i === 0 ? TIMELINE_ENDS.start : i === count - 1 ? TIMELINE_ENDS.end : null) : null;
                  return (
                    <li key={i} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => jump(i)}
                        aria-label={`Babak ${i + 1}: ${st.title}`}
                        aria-current={current ? "step" : undefined}
                        className="group flex w-full cursor-pointer flex-col items-center gap-2.5 outline-none"
                      >
                        <span className="relative flex size-7 items-center justify-center sm:size-11">
                          {current ? (
                            <span aria-hidden className="absolute inset-0 rounded-full border border-cyan/60 motion-safe:animate-ping" />
                          ) : null}
                          {edge ? (
                            <span
                              aria-hidden
                              className={cn(
                                "tl-gate absolute -inset-1.5 rounded-full border border-dashed transition-colors sm:-inset-2",
                                current || done ? "border-cyan/60" : "border-white/20",
                              )}
                            />
                          ) : null}
                          <span
                            className={cn(
                              "tl-orb relative flex size-full items-center justify-center rounded-full border transition-all duration-300",
                              current
                                ? "tl-orb-done tl-orb-active -translate-y-1 scale-125 border-white/40 text-white"
                                : done
                                  ? "tl-orb-done border-white/25 text-white"
                                  : "border-white/12 text-muted group-hover:-translate-y-0.5 group-hover:border-cyan/50 group-hover:text-ink",
                              "group-focus-visible:ring-2 group-focus-visible:ring-cyan",
                            )}
                          >
                            {(() => {
                              const Icon = CHAPTER_ICONS[i % CHAPTER_ICONS.length];
                              return <Icon aria-hidden strokeWidth={2.3} className={cn("size-3.5 sm:size-5", current || done ? "tl-icon" : "tl-icon-dim")} />;
                            })()}
                          </span>
                          {edge ? (
                            <span
                              aria-hidden
                              className={cn(
                                "tl-edge-badge absolute -top-7 left-1/2 hidden -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full py-0.5 pl-1.5 pr-2 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.16em] sm:flex",
                                current || done ? "tl-edge-badge-on" : "",
                              )}
                            >
                              <edge.Icon strokeWidth={2.6} className="size-2.5" />
                              {edge.tag}
                            </span>
                          ) : (
                            <span
                              aria-hidden
                              className={cn(
                                "absolute -right-1.5 -top-1.5 hidden size-[1.125rem] items-center justify-center rounded-full border text-[0.5625rem] font-bold tabular-nums sm:flex",
                                current ? "border-cyan/70 bg-[#0a0716] text-cyan" : "border-white/15 bg-[#0a0716] text-muted",
                              )}
                            >
                              {i}
                            </span>
                          )}
                        </span>
                        <span className="hidden flex-col items-center gap-0.5 lg:flex">
                          <span
                            className={cn(
                              "text-balance text-center font-display text-[0.625rem] font-medium uppercase leading-tight tracking-[0.1em] transition-colors",
                              current ? "text-ink" : done ? "text-ink-soft" : "text-muted group-hover:text-ink-soft",
                            )}
                          >
                            {edge ? edge.label : st.mood}
                          </span>
                          {st.minutes ? (
                            <span className={cn("font-mono text-[0.625rem] transition-colors", current ? "text-cyan" : "text-muted/70")}>{st.minutes}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            {/* phones and tablets have no room for seven labels, so only the current chapter is named */}
            <p className="mt-3 text-center font-display text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink lg:hidden">
              {(() => {
                const edge = count > 2 ? (stepIndex === 0 ? TIMELINE_ENDS.start : stepIndex === count - 1 ? TIMELINE_ENDS.end : null) : null;
                return (
                  <>
                    <span className="text-cyan">{edge ? edge.tag : String(stepIndex).padStart(2, "0")}</span>
                    <span aria-hidden className="mx-2 text-muted">/</span>
                    {edge ? edge.label : step?.mood}
                  </>
                );
              })()}
              {step?.minutes ? <span className="ml-2 font-mono normal-case tracking-normal text-muted">· {step.minutes}</span> : null}
            </p>
          </div>
        </nav>
      </div>

      <ol className="sr-only">
        {steps.slice(0, count).map((st, i) => (
          <li key={i}>
            {st.mood}: {st.title}. {st.description} {st.minutes}
            {st.flow?.length ? ` Alur: ${st.flow.join(", ")}.` : ""}
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

const STATIC_VISUALS: ({ art: "ticket" | "holomedis" | "souvenir" } | { src: string; position: string; video?: string })[] = [
  { art: "ticket" },
  { src: "/experience/journey-of-life.jpg", position: "50% 40%" },
  { src: "/experience/dj.jpg", position: "50% 40%", video: "/experience/dj-beat.mp4" },
  { art: "holomedis" },
  { src: "/showroom/32.jpg", position: "50% 40%" },
  { src: "/experience/print3d.jpg", position: "60% 50%", video: "/experience/dragon-print.mp4" },
  { art: "souvenir" },
];

/** Fallback with no WebGL or motion: the same chapters as a plain illustrated list. */
function StaticExperience({ steps }: { steps: StageStep[] }) {
  return (
    <div id="journey" data-mode="static">
      <ol className="mx-auto max-w-5xl space-y-16 px-5 py-16 sm:px-10">
        {steps.map((s, i) => {
          const v = STATIC_VISUALS[i % STATIC_VISUALS.length];
          const photo = "art" in v ? "" : s.image || v.src;
          return (
            <li key={i} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
              <div className={cn("relative aspect-[1400/1140] overflow-hidden rounded-xl border border-line md:order-2")}>
                {"art" in v ? (
                  <CanvasArt kind={v.art} />
                ) : v.video ? (
                  <video src={v.video} poster={photo} autoPlay muted loop playsInline preload="metadata" aria-hidden className="absolute inset-0 size-full object-cover" style={{ objectPosition: "50% 40%" }} />
                ) : (
                  <Image src={photo} alt="" fill unoptimized={photo.startsWith("/media/")} sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" style={{ objectPosition: v.position }} />
                )}
              </div>
              <div>
                {(() => {
                  const { edge, num } = chapterLabel(i, steps.length);
                  const acts = steps.length > 2 ? steps.length - 2 : steps.length;
                  return (
                    <>
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                        {edge ? edge.tag : `Babak ${String(num).padStart(2, "0")} / ${String(acts).padStart(2, "0")}`}
                        {s.minutes ? <span className="text-ink-soft"> · {s.minutes}</span> : null}
                      </p>
                      <h2 className="mt-3 font-display text-2xl font-semibold uppercase text-ink sm:text-3xl">{edge ? edge.label : s.mood}</h2>
                      <p className="mt-1.5 text-sm font-semibold text-cyan">{s.title}</p>
                      <p className="mt-4 text-base leading-8 text-ink-soft">{s.description}</p>
                      {s.flow?.length ? (
                        <div className="mt-5">
                          <FlowSteps flow={s.flow} />
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
