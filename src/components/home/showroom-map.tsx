"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { floorLabels, officeRooms, showroomZones, type Floor, type ShowroomZone } from "@/data/showroom";
import { cn } from "@/lib/utils/cn";

interface ZoneText {
  name: string;
  /** CMS photos; empty = the built-in ones. */
  photos: string[];
}

const FLOORS: Floor[] = ["ground", "mezzanine"];

/** Car stalls in the parking lot, drawn after the architectural plan (not to scale). [x, y, w, h] */
const CARS: [number, number, number, number][] = [
  // top and bottom rows, nose to the wall
  [784, 24, 44, 112], [906, 24, 44, 112],
  [784, 344, 44, 112], [906, 344, 44, 112],
  // two rows of three in the middle
  [778, 186, 100, 42], [894, 186, 100, 42], [1010, 186, 100, 42],
  [778, 252, 100, 42], [894, 252, 100, 42], [1010, 252, 100, 42],
  // along the far side
  [1164, 120, 44, 112], [1164, 250, 44, 112],
];
const PLANTERS: [number, number][] = [[867, 80], [867, 400], [990, 80], [990, 400]];
const BIKES = [1028, 1048, 1068];

/**
 * Interactive plan of the showroom. The selected zone (its photos and name) is
 * shown large on top, the schematic plan below it: the building on two levels
 * plus the parking lot in front. Zones are buttons on the plan (keyboard
 * accessible). On phones the plan keeps a readable size and scrolls sideways.
 */
export function ShowroomMap({ zones, note, office }: { zones: ZoneText[]; note: string; office: string }) {
  const [floor, setFloor] = useState<Floor>("ground");
  const [activeId, setActiveId] = useState("hall");
  const [photo, setPhoto] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  const all = showroomZones.map((z, i) => ({ ...z, name: zones[i]?.name || z.name, photos: zones[i]?.photos?.length ? zones[i].photos : z.photos, n: i + 1 }));
  const active = all.find((z) => z.id === activeId) ?? all[1];
  const onFloor = all.filter((z) => z.floor === floor);
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
                <p className="text-sm text-muted">Foto ruang ini akan segera ditambahkan.</p>
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
                {floorLabels[f]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted sm:hidden">Geser denah ke samping untuk melihat area parkir.</p>
        </div>

        <div className="rounded-2xl border border-line bg-[#0a0720]/80 p-3 sm:p-5">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            <svg viewBox="0 0 1260 480" role="group" aria-label={`Denah ${floorLabels[floor]} dan area parkir`} className="h-auto w-full min-w-[760px] sm:min-w-0">
              <defs>
                <linearGradient id="zone-active" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity="0.5" />
                </linearGradient>
                <pattern id="void-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#6366f1" strokeOpacity="0.28" strokeWidth="2" />
                </pattern>
                <pattern id="office-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#8b87a8" strokeOpacity="0.22" strokeWidth="2" />
                </pattern>
              </defs>

              {/* building outline and a few fixed features */}
              <rect x="14" y="14" width="732" height="452" rx="16" fill="none" stroke="#2c2551" strokeWidth="2" />
              <g aria-hidden>
                {floor === "mezzanine" ? (
                  <>
                    <rect x="208" y="185" width="522" height="261" fill="url(#void-hatch)" stroke="#2c2551" strokeDasharray="6 6" />
                    <text x="470" y="270" fontSize="17" fill="#8b87a8" textAnchor="middle" className="hidden sm:block">
                      Area terbuka di atas aula
                    </text>
                  </>
                ) : null}
              </g>

              {/* the other level, dimmed, so the plan keeps its footprint */}
              {all
                .filter((z) => z.floor !== floor && z.shape.kind === "rect")
                .map((z) => {
                  const r = z.shape as Extract<ShowroomZone["shape"], { kind: "rect" }>;
                  return <rect key={z.id} aria-hidden x={r.x} y={r.y} width={r.w} height={r.h} rx={12} fill="none" stroke="#2c2551" strokeOpacity="0.55" strokeDasharray="5 6" />;
                })}
              {onFloor.map((z) => (
                <Zone key={z.id} zone={z} n={z.n} label={z.name} active={z.id === activeId} onSelect={() => select(z)} />
              ))}

              {/* offices and service rooms: shown for the footprint only, not part of the visit */}
              <g aria-hidden>
                {officeRooms.map((r, i) =>
                  ground ? (
                    <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={10} fill="url(#office-hatch)" stroke="#2c2551" strokeWidth="2" />
                  ) : (
                    <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={12} fill="none" stroke="#2c2551" strokeOpacity="0.55" strokeDasharray="5 6" />
                  ),
                )}
              </g>

              {ground ? (
                <g aria-hidden style={{ pointerEvents: "none" }}>
                  {/* LED wall of the command center: 8 TVs in two rows */}
                  {Array.from({ length: 8 }, (_, i) => (
                    <rect key={i} x={73 + (i % 4) * 23} y={262 + Math.floor(i / 4) * 19} width="20" height="16" rx="2" fill="#22d3ee" fillOpacity={activeId === "command" ? 0.95 : 0.7} />
                  ))}
                  <text x="117" y="322" textAnchor="middle" fontSize="12" fill="#67e8f9" className="hidden sm:block">
                    Dinding LED · 8 TV
                  </text>

                  {/* parking: stalls, planters, motorbikes, the gate and the main door */}
                  <g fill="none" stroke="#8b87a8" strokeOpacity={activeId === "parking" ? 0.75 : 0.4} strokeWidth="1.5">
                    {CARS.map(([x, y, w, h], i) => (
                      <rect key={i} x={x} y={y} width={w} height={h} rx="10" />
                    ))}
                    {PLANTERS.map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="22" strokeDasharray="3 4" />
                    ))}
                    {BIKES.flatMap((x) => [
                      <rect key={`t${x}`} x={x} y="34" width="12" height="62" rx="6" />,
                      <rect key={`b${x}`} x={x} y="384" width="12" height="62" rx="6" />,
                    ])}
                  </g>
                  <path d="M1246 34 v62" stroke="#0a0720" strokeWidth="6" />
                  <path d="M1240 65 h-34 m10 -9 l-10 9 l10 9" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="1196" y="114" textAnchor="middle" fontSize="13" fill="#67e8f9" className="hidden sm:block">
                    Gerbang
                  </text>
                  <rect x="748" y="200" width="10" height="130" rx="3" fill="#f97316" fillOpacity="0.9" />
                </g>
              ) : null}

              {/* stairs up, beside the break out area */}
              <g aria-hidden stroke="#8b87a8" strokeOpacity="0.8" strokeWidth="1.5">
                {Array.from({ length: 9 }, (_, i) => (
                  <line key={i} x1={388 + i * 11} y1="38" x2={388 + i * 11} y2="62" />
                ))}
                <rect x="388" y="38" width="88" height="24" fill="none" />
              </g>
            </svg>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            {office ? (
              <p className="flex items-center gap-2">
                <span aria-hidden className="inline-block size-3 shrink-0 rounded-sm border border-line bg-[repeating-linear-gradient(45deg,rgb(139_135_168/0.35)_0_2px,transparent_2px_6px)]" />
                {office}
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-1.5 shrink-0 rounded-sm bg-[#f97316]" />
              Pintu utama, dari area parkir ke aula
            </p>
          </div>
          {note ? <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p> : null}
        </div>
      </div>
    </div>
  );
}

function Zone({ zone, n, label, active, onSelect }: { zone: ShowroomZone; n: number; label: string; active: boolean; onSelect: () => void }) {
  const s = zone.shape;
  const common = {
    fill: active ? "url(#zone-active)" : "#171236",
    stroke: active ? "#a78bfa" : "#3a3266",
    strokeWidth: active ? 3 : 2,
    className: "transition-[fill,stroke] duration-200",
  };
  const [bx, by] = zone.badge;
  const sm = zone.size === "sm";
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Zona ${n}: ${label}`}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="cursor-pointer outline-none [&:focus-visible>.zone-shape]:stroke-white hover:[&>.zone-shape]:stroke-[#a78bfa]"
    >
      {s.kind === "rect" ? (
        <rect className={cn("zone-shape", common.className)} x={s.x} y={s.y} width={s.w} height={s.h} rx={sm ? 10 : 12} fill={common.fill} stroke={common.stroke} strokeWidth={common.strokeWidth} />
      ) : (
        <circle className={cn("zone-shape", common.className)} cx={s.cx} cy={s.cy} r={s.r} fill={common.fill} stroke={common.stroke} strokeWidth={common.strokeWidth} />
      )}
      <circle cx={bx} cy={by} r={sm ? 15 : 24} fill={active ? "#ffffff" : "#2a2352"} />
      <text x={bx} y={by + (sm ? 6 : 8)} textAnchor="middle" fontSize={sm ? 17 : 23} fontWeight="700" fill={active ? "#1b1240" : "#e9e5ff"}>
        {n}
      </text>
      {zone.tag ? (
        <text x={bx} y={by + (sm ? 33 : 44)} textAnchor="middle" fontSize={sm ? 14 : 19} fontWeight="600" fill={active ? "#ffffff" : "#b7b0d8"} className="hidden sm:block" style={{ pointerEvents: "none" }}>
          {zone.tag}
        </text>
      ) : null}
    </g>
  );
}
