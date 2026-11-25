"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight, Clock3, Disc3, Gift, House, Printer, Projector, Stethoscope, Ticket, type LucideIcon } from "lucide-react";
import { canvas, drawHolomedis, drawTicket } from "@/components/home/stage/art";
import { ShoeScene } from "@/components/home/shoe-scene";
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

/** Words of the timeline, from the CMS ("Perjalanan"). */
export interface StageText {
  startTag: string;
  endTag: string;
  actWord: string;
  flowHeading: string;
}

const MAX_CHAPTERS = 7; // one visual per chapter in VISUALS

/**
 * The first and last chapters are the arrival and the send-off, not show acts,
 * so the timeline marks them MULAI / SELESAI instead of a number. The acts in
 * between are numbered from 1.
 */
function chapterLabel(i: number, count: number, text: StageText) {
  if (count > 2 && i === 0) return { edge: text.startTag, num: null };
  if (count > 2 && i === count - 1) return { edge: text.endTag, num: null };
  return { edge: null, num: count > 2 ? i : i + 1 };
}

/** The guest's path through a chapter: numbered steps joined by chevrons. */
function FlowSteps({ flow }: { flow: string[] }) {
  if (flow.length === 0) return null;
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

/** Draws one of the canvas artworks once (the e-ticket and the AI assistant screen). */
function CanvasArt({ kind }: { kind: "ticket" | "holomedis" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const [c, g] = kind === "ticket" ? canvas(800, 640) : canvas(1024, 768);
    if (kind === "ticket") drawTicket(g);
    else drawHolomedis(g, 6, true);
    c.className = "max-h-full max-w-full";
    c.setAttribute("aria-hidden", "true");
    host.replaceChildren(c);
  }, [kind]);
  return <div ref={ref} className="flex size-full items-center justify-center bg-[#0a0716] p-4" />;
}

/** The picture of each chapter, in order. Photo chapters can be replaced from the CMS. */
const VISUALS: ({ art: "ticket" | "holomedis" } | { scene: "shoe"; src: string } | { src: string; position: string; video?: string })[] = [
  { art: "ticket" },
  { src: "/experience/journey-of-life.jpg", position: "50% 40%" },
  // the DJ video is portrait: frame its lower part so the DJ stays in view
  { src: "/experience/dj.jpg", position: "50% 80%", video: "/experience/dj-beat.mp4" },
  { art: "holomedis" },
  { src: "/showroom/32.jpg", position: "50% 40%" },
  { src: "/experience/print3d.jpg", position: "60% 50%", video: "/experience/dragon-print.mp4" },
  // the finale: the 3D-printed sneaker, printed as the panel scrolls in (picture only without WebGL)
  { scene: "shoe", src: "/experience/finale-shoe.jpg" },
];

/**
 * The seven chapters of the show as an ordinary scrolling list (no 3D, no
 * pinned scroll): each chapter has its text on the left and its picture on
 * the right. The timeline (Mulai, 1-5, Selesai) runs down the left side: on
 * wide screens as a sticky index that follows the chapter being read, on
 * phones and tablets as a rail with one node per chapter.
 */
export function ExperienceStage({ steps, text }: { steps: StageStep[]; text: StageText }) {
  const act = (n: number) => `${text.actWord} ${String(n).padStart(2, "0")}`.trim();
  const list = steps.slice(0, MAX_CHAPTERS);
  const count = list.length;
  const acts = count > 2 ? count - 2 : count;
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  // the chapter crossing the middle of the screen is the current one
  useEffect(() => {
    const els = items.current.slice(0, count).filter((el): el is HTMLLIElement => Boolean(el));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [count]);

  function go(i: number) {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    items.current[i]?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }

  const progress = count > 1 ? active / (count - 1) : 0;

  return (
    <section id="journey" aria-label="Perjalanan HOLOLABS" className="relative bg-[#0a0618] py-20 sm:py-28">
      <div className="container-gutter mx-auto w-full max-w-7xl lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[16rem_minmax(0,1fr)]">
        {/* wide screens: sticky timeline on the left */}
        <nav aria-label="Babak perjalanan" className="hidden lg:block">
          {/* as tall as the screen allows, so the line runs the whole height of the column */}
          <div className="sticky top-28">
            <ol className="relative flex h-[calc(100dvh-9rem)] max-h-[52rem] min-h-[30rem] flex-col justify-between">
              <span aria-hidden className="absolute bottom-6 left-[1.375rem] top-6 w-0.5 -translate-x-1/2 rounded-full bg-white/10">
                <span className="block w-full rounded-full bg-gradient-to-b from-cyan to-[#a855f7] shadow-[0_0_12px_rgb(34_211_238/0.55)] transition-[height] duration-500" style={{ height: `${progress * 100}%` }} />
              </span>
              {list.map((st, i) => {
                const { edge, num } = chapterLabel(i, count, text);
                const Icon = CHAPTER_ICONS[i % CHAPTER_ICONS.length];
                const current = i === active;
                const done = i < active;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-current={current ? "step" : undefined}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl py-2 pr-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                    >
                      <span
                        className={cn(
                          "tl-orb relative flex size-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                          current ? "tl-orb-done tl-orb-active border-white/40 text-white" : done ? "tl-orb-done border-white/25 text-white" : "border-white/12 text-muted group-hover:border-cyan/50 group-hover:text-ink",
                        )}
                      >
                        <Icon aria-hidden strokeWidth={2.3} className={cn("size-5", current || done ? "tl-icon" : "tl-icon-dim")} />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]", current ? "text-cyan" : "text-muted")}>
                          {edge ?? act(num ?? 0)}
                          {st.minutes ? <span className="font-normal normal-case tracking-normal text-muted"> · {st.minutes}</span> : null}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block font-display text-xs font-semibold uppercase leading-snug tracking-[0.06em] transition-colors",
                            current ? "text-ink" : done ? "text-ink-soft" : "text-muted group-hover:text-ink-soft",
                          )}
                        >
                          {st.mood}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        {/* chapters; on phones and tablets a rail with one node per chapter runs down the left */}
        <ol className="relative space-y-16 pl-12 sm:space-y-20 sm:pl-16 lg:space-y-28 lg:pl-0">
          <span aria-hidden className="absolute bottom-2 left-[1.125rem] top-2 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan/60 via-[#a78bfa]/45 to-[#e879f9]/30 sm:left-[1.375rem] lg:hidden" />
          {list.map((st, i) => {
            const { edge, num } = chapterLabel(i, count, text);
            const Icon = CHAPTER_ICONS[i % CHAPTER_ICONS.length];
            const v = VISUALS[i % VISUALS.length];
            const photo = "art" in v ? "" : "scene" in v ? v.src : st.image || v.src;
            return (
              <li
                key={i}
                ref={(el) => {
                  items.current[i] = el;
                }}
                data-index={i}
                className="relative scroll-mt-28"
              >
                <span
                  aria-hidden
                  className="tl-orb tl-orb-done absolute -left-12 top-0 flex size-9 items-center justify-center rounded-full border border-white/30 text-white sm:-left-16 sm:size-11 lg:hidden"
                >
                  <Icon strokeWidth={2.3} className="tl-icon size-4 sm:size-5" />
                </span>
                <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10 xl:gap-14">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em]">
                      <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-cyan">
                        {edge ?? `${act(num ?? 0)} / ${String(acts).padStart(2, "0")}`}
                      </span>
                      {st.minutes ? (
                        <span className="flex items-center gap-1.5 normal-case tracking-normal text-ink-soft">
                          <Clock3 aria-hidden className="size-3.5 text-cyan/80" />
                          {st.minutes}
                        </span>
                      ) : null}
                    </p>
                    <h2 className="mt-4 font-display text-[1.65rem] font-semibold uppercase leading-[1.08] text-ink sm:text-4xl">{st.mood}</h2>
                    <p className="mt-2 bg-gradient-to-r from-cyan via-[#a5b4fc] to-[#f0abfc] bg-clip-text text-sm font-semibold text-transparent sm:text-base">{st.title}</p>
                    <p className="mt-4 text-[0.9375rem] leading-7 text-ink-soft sm:text-base sm:leading-8">{st.description}</p>
                    {st.flow?.length ? (
                      <div className="mt-5 border-t border-white/10 pt-4">
                        {text.flowHeading ? <p className="mb-2.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">{text.flowHeading}</p> : null}
                        <FlowSteps flow={st.flow} />
                      </div>
                    ) : null}
                  </div>
                  <div className="relative aspect-[1400/1140] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0716]">
                    {"art" in v ? (
                      <CanvasArt kind={v.art} />
                    ) : "scene" in v ? (
                      <ShoeScene fallback={v.src} />
                    ) : v.video && (!st.image || st.image === v.src) ? (
                      <video src={v.video} poster={photo} autoPlay muted loop playsInline preload="metadata" aria-hidden className="absolute inset-0 size-full object-cover" style={{ objectPosition: v.position }} />
                    ) : (
                      <Image
                        src={photo}
                        alt={st.title}
                        fill
                        unoptimized={photo.startsWith("/media/")}
                        sizes="(min-width: 1280px) 480px, (min-width: 768px) 40vw, 100vw"
                        className="object-cover"
                        style={{ objectPosition: v.position }}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
