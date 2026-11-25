"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { floorLabels, internalRooms, PLAN_IMAGE, showroomZones, type Floor, type ShowroomZone } from "@/data/showroom";
import type React from "react";
import { cn } from "@/lib/utils/cn";

interface ZoneText {
  name: string;
  /** Short label on the plan; empty = the built-in one. */
  tag?: string;
  /** CMS photos; empty = the built-in ones. */
  photos: string[];
}

/** Every other text of the plan, from the CMS ("Denah showroom"). */
export interface MapText {
  noPhoto: string;
  floorGround: string;
  floorUpper: string;
  swipeHint: string;
  /** The plan picture (CMS upload or the built-in render). */
  planImage: string;
  note: string;
}

const FLOORS: Floor[] = ["ground", "mezzanine"];

/**
 * Interactive plan of the showroom. The selected zone (its photos and name) is
 * shown large on top, the plan below it: the realistic top-view render of the
 * building and the parking lot, with every zone a button laid over its room
 * (outline, number badge, name on hover and when selected; keyboard
 * accessible). The second-floor tab dims and blurs the picture and shows the
 * audience seating over the top band of the hall. On phones the plan keeps a
 * readable size and scrolls sideways.
 */
export function ShowroomMap({ zones, text }: { zones: ZoneText[]; text: MapText }) {
  const { note } = text;
  const planSrc = text.planImage || PLAN_IMAGE.src;
  const { width: PW, height: PH } = PLAN_IMAGE;
  const floorName: Record<Floor, string> = {
    ground: text.floorGround || floorLabels.ground,
    mezzanine: text.floorUpper || floorLabels.mezzanine,
  };
  const [floor, setFloor] = useState<Floor>("ground");
  const [activeId, setActiveId] = useState("hall");
  const [photo, setPhoto] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  const all = showroomZones.map((z, i) => ({ ...z, name: zones[i]?.name || z.name, tag: zones[i]?.tag || z.tag, photos: zones[i]?.photos?.length ? zones[i].photos : z.photos, n: i + 1 }));
  const active = all.find((z) => z.id === activeId) ?? all[1];
  const groundZones = all.filter((z) => z.floor === "ground");
  const upperZones = all.filter((z) => z.floor === "mezzanine");
  const ground = floor === "ground";

  function select(zone: (typeof all)[number]) {
    setActiveId(zone.id);
    setFloor(zone.floor);
    setPhoto(0);
    // the photo sits above the plan: bring it back into view when most of it is off screen
    const el = detailRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 96);
    if (visible < r.height * 0.6) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    }
  }

  const step = (dir: 1 | -1) => setPhoto((p) => (p + dir + active.photos.length) % active.photos.length);

  return (
    <div>
      {/* selected zone: large photo with its name */}
      <div ref={detailRef} className="scroll-mt-28">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface/60">
          <div className="relative aspect-[16/10] bg-black sm:aspect-[16/9] lg:aspect-[21/9]">
            {active.photos.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_30%_20%,rgb(99_102_241/0.25),transparent_60%),radial-gradient(ellipse_at_80%_90%,rgb(217_70_239/0.18),transparent_60%)] px-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full border border-line bg-surface-raised text-lg font-bold text-ink">{active.n}</span>
                <p className="text-base font-semibold text-ink">{active.name}</p>
                {text.noPhoto ? <p className="text-sm text-muted">{text.noPhoto}</p> : null}
              </div>
            ) : null}
            {active.photos.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={i === photo ? active.name : ""}
                fill
                unoptimized
                sizes="(min-width: 1280px) 1216px, 100vw"
                className={cn("object-cover transition-opacity duration-500", i === photo ? "opacity-100" : "opacity-0")}
                priority={false}
              />
            ))}
            {active.photos.length > 1 ? (
              <>
                <button type="button" aria-label="Foto sebelumnya" onClick={() => step(-1)} className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 sm:left-5">
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button type="button" aria-label="Foto berikutnya" onClick={() => step(1)} className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 sm:right-5">
                  <ChevronRight className="size-5" aria-hidden />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {active.photos.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      aria-label={`Foto ${i + 1} dari ${active.photos.length}`}
                      aria-current={i === photo}
                      onClick={() => setPhoto(i)}
                      className={cn("h-1.5 rounded-full transition-all", i === photo ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80")}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="flex items-baseline gap-4 px-5 py-4 sm:px-8 sm:py-6">
            <span className="font-label text-sm font-bold text-cyan sm:text-base">{String(active.n).padStart(2, "0")}</span>
            <h3 className="text-2xl font-semibold text-ink sm:text-3xl lg:text-4xl">{active.name}</h3>
          </div>
        </div>
      </div>

      {/* plan */}
      <div className="mt-8 sm:mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Lantai" className="inline-flex rounded-pill border border-line bg-surface/60 p-1">
            {FLOORS.map((f) => (
              <button
                key={f}
                role="tab"
                type="button"
                aria-selected={floor === f}
                onClick={() => {
                  setFloor(f);
                  const first = all.find((z) => z.floor === f);
                  if (first && active.floor !== f) select(first);
                }}
                className={cn(
                  "rounded-pill px-5 py-2 text-sm font-semibold transition",
                  floor === f ? "bg-gradient-to-r from-brand to-accent text-canvas" : "text-ink-soft hover:text-ink",
                )}
              >
                {floorName[f]}
              </button>
            ))}
          </div>
          {text.swipeHint ? <p className="text-xs text-muted sm:hidden">{text.swipeHint}</p> : null}
        </div>

        <div className="rounded-2xl border border-line bg-[#0a0720]/80 p-3 sm:p-5">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            <svg viewBox={`0 0 ${PW} ${PH}`} role="group" aria-label={`Denah ${floorName[floor]}`} className="h-auto w-full min-w-[760px] overflow-hidden rounded-xl sm:min-w-0">
              <defs>
                <linearGradient id="zone-active" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity="0.36" />
                </linearGradient>
                <filter id="plan-blur">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
                <filter id="office-blur" x="-5%" y="-5%" width="110%" height="110%">
                  <feGaussianBlur stdDeviation="11" />
                </filter>
                <clipPath id="office-clip">
                  {internalRooms.map((r, i) => (
                    <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={6} />
                  ))}
                </clipPath>
              </defs>

              {/* the picture: sharp on the ground floor tab, dimmed and blurred behind the second floor */}
              <image
                href={planSrc}
                width={PW}
                height={PH}
                preserveAspectRatio="xMidYMid slice"
                filter={ground ? undefined : "url(#plan-blur)"}
                opacity={ground ? 1 : 0.35}
                className="transition-opacity duration-300"
              />

              {/* internal offices: the same picture blurred inside their outline, not selectable */}
              <g aria-hidden clipPath="url(#office-clip)" style={{ pointerEvents: "none" }} opacity={ground ? 1 : 0.35}>
                <image href={planSrc} width={PW} height={PH} preserveAspectRatio="xMidYMid slice" filter="url(#office-blur)" />
                {internalRooms.map((r, i) => (
                  <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#0a0720" fillOpacity={0.25} />
                ))}
              </g>

              {ground
                ? groundZones.map((z) => <Zone key={z.id} zone={z} n={z.n} label={z.name} tag={z.tag} active={z.id === activeId} onSelect={() => select(z)} />)
                : upperZones.map((z) => {
                    const r = z.shape;
                    return (
                      <g key={z.id}>
                        {/* a solid plate for the deck, so the hall below does not show through */}
                        {r.kind === "rect" ? <rect aria-hidden x={r.x} y={r.y} width={r.w} height={r.h} rx={16} fill="#0f0b26" fillOpacity={0.88} /> : null}
                        <Zone zone={z} n={z.n} label={z.name} tag={z.tag} active={z.id === activeId} alwaysTag onSelect={() => select(z)} />
                      </g>
                    );
                  })}
            </svg>
          </div>
          {note ? <p className="mt-3 text-xs leading-relaxed text-muted">{note}</p> : null}
        </div>
      </div>
    </div>
  );
}

function Zone({
  zone,
  n,
  label,
  tag,
  active,
  alwaysTag = false,
  onSelect,
}: {
  zone: ShowroomZone;
  n: number;
  label: string;
  tag: string;
  active: boolean;
  /** Show the name chip even when not selected or hovered. */
  alwaysTag?: boolean;
  onSelect: () => void;
}) {
  const s = zone.shape;
  const [bx, by] = zone.badge;
  const sm = zone.size === "sm";
  const r = sm ? 22 : 27;
  // name chip under the badge; width estimated from the text so it fits any CMS name
  const chipFont = sm ? 19 : 22;
  const chipW = Math.max(60, tag.length * chipFont * 0.58 + 28);
  const chipY = by + r + 10;
  const shape = {
    className: cn(
      "zone-shape transition-[fill,stroke,stroke-opacity] duration-200",
      active ? "" : "group-hover:fill-[#8b5cf6]/20 group-hover:stroke-[#c4b5fd] group-hover:[stroke-opacity:1] group-focus-visible:stroke-white group-focus-visible:[stroke-opacity:1]",
    ),
    fill: active ? "url(#zone-active)" : "transparent",
    stroke: active ? "#c4b5fd" : "#ffffff",
    strokeOpacity: active ? 1 : 0.35,
    strokeWidth: active ? 4 : 2.5,
    strokeDasharray: active ? undefined : "10 8",
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Zona ${n}: ${label}`}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="group cursor-pointer outline-none"
    >
      {s.kind === "rect" ? (
        <rect {...shape} x={s.x} y={s.y} width={s.w} height={s.h} rx={14} />
      ) : (
        <circle {...shape} cx={s.cx} cy={s.cy} r={s.r} />
      )}
      {/* number badge */}
      <circle cx={bx} cy={by} r={r + 5} fill={active ? "#a78bfa" : "#000000"} fillOpacity={active ? 0.45 : 0.25} />
      <circle cx={bx} cy={by} r={r} fill={active ? "#ffffff" : "#1b1240"} stroke="#ffffff" strokeOpacity={active ? 0 : 0.7} strokeWidth={2} className={active ? undefined : "transition-[fill] duration-200 group-hover:fill-[#6d28d9]"} />
      <text x={bx} y={by + (sm ? 7.5 : 9)} textAnchor="middle" fontSize={sm ? 21 : 26} fontWeight="700" fill={active ? "#1b1240" : "#ffffff"} style={{ pointerEvents: "none" }}>
        {n}
      </text>
      {/* name chip: on hover and focus, and always for the selected zone */}
      {tag ? (
        <g
          style={{ pointerEvents: "none" }}
          className={cn("transition-opacity duration-200", active || alwaysTag ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}
        >
          <rect x={bx - chipW / 2} y={chipY} width={chipW} height={chipFont + 16} rx={(chipFont + 16) / 2} fill="#0b0820" fillOpacity={0.88} stroke="#c4b5fd" strokeOpacity={0.6} />
          <text x={bx} y={chipY + chipFont + 3} textAnchor="middle" fontSize={chipFont} fontWeight="600" fill="#ffffff">
            {tag}
          </text>
        </g>
      ) : null}
    </g>
  );
}
