"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { floorLabels, officeRooms, showroomZones, type Floor, type ShowroomZone } from "@/data/showroom";
import { cn } from "@/lib/utils/cn";

interface ZoneText {
  name: string;
  description: string;
  /** CMS photos; empty = the built-in ones. */
  photos: string[];
}

const FLOORS: Floor[] = ["ground", "mezzanine"];

/**
 * Interactive plan of the showroom. The schematic plan (two levels) sits on the
 * left, the selected zone on the right with its photos. Zones are plain
 * buttons on the plan and in a list under it, so the plan works with keyboard
 * and on phones where the labels on the drawing would be too small to read.
 */
export function ShowroomMap({ zones, note, office, cta, address, mapsHref }: { zones: ZoneText[]; note: string; office: string; cta: string; address: string; mapsHref: string }) {
  const [floor, setFloor] = useState<Floor>("ground");
  const [activeId, setActiveId] = useState("hall");
  const [photo, setPhoto] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  const all = showroomZones.map((z, i) => ({ ...z, name: zones[i]?.name || z.name, description: zones[i]?.description || z.description, photos: zones[i]?.photos?.length ? zones[i].photos : z.photos, n: i + 1 }));
  const active = all.find((z) => z.id === activeId) ?? all[1];
  const onFloor = all.filter((z) => z.floor === floor);

  function select(zone: (typeof all)[number]) {
    setActiveId(zone.id);
    setFloor(zone.floor);
    setPhoto(0);
    // on phones the photo sits above the plan: bring it back into view after a pick
    if (window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const step = (dir: 1 | -1) => setPhoto((p) => (p + dir + active.photos.length) % active.photos.length);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-12">
      {/* plan */}
      <div>
        <div role="tablist" aria-label="Lantai" className="mb-4 inline-flex rounded-pill border border-line bg-surface/60 p-1">
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

        <div className="rounded-2xl border border-line bg-[#0a0720]/80 p-3 sm:p-5">
          <svg viewBox="0 0 760 480" role="group" aria-label={`Denah ${floorLabels[floor]}`} className="h-auto w-full">
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
                    Void aula utama
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

            {/* offices: shown for the footprint only, not part of the visit */}
            <g aria-hidden>
              {officeRooms.map((r, i) =>
                floor === "ground" ? (
                  <g key={i}>
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} fill="url(#office-hatch)" stroke="#2c2551" strokeWidth="2" />
                    <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 5} textAnchor="middle" fontSize="13" fill="#6f6a8f" className="hidden sm:block">
                      Kantor
                    </text>
                  </g>
                ) : (
                  <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={12} fill="none" stroke="#2c2551" strokeOpacity="0.55" strokeDasharray="5 6" />
                ),
              )}
            </g>
            {/* LED wall of the command center: 8 TVs in two rows */}
            {floor === "ground" ? (
              <g aria-hidden style={{ pointerEvents: "none" }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <rect key={i} x={73 + (i % 4) * 23} y={262 + Math.floor(i / 4) * 19} width="20" height="16" rx="2" fill="#22d3ee" fillOpacity={activeId === "command" ? 0.95 : 0.7} />
                ))}
                <text x="117" y="322" textAnchor="middle" fontSize="12" fill="#67e8f9" className="hidden sm:block">
                  Dinding LED · 8 TV
                </text>
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
          {office ? (
            <p className="mt-3 flex items-center gap-2 text-xs leading-relaxed text-muted">
              <span aria-hidden className="inline-block size-3 shrink-0 rounded-sm border border-line bg-[repeating-linear-gradient(45deg,rgb(139_135_168/0.35)_0_2px,transparent_2px_6px)]" />
              {office}
            </p>
          ) : null}
          {note ? <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p> : null}
        </div>

        {/* zone list: the readable version of the plan on phones, and a keyboard-friendly index */}
        <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {all.map((z) => (
            <li key={z.id}>
              <button
                type="button"
                onClick={() => select(z)}
                aria-pressed={z.id === activeId}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                  z.id === activeId ? "border-accent/60 bg-accent/10 text-ink" : "border-line text-ink-soft hover:border-accent/40 hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    z.id === activeId ? "bg-gradient-to-br from-brand to-accent text-canvas" : "bg-surface-raised text-ink-soft",
                  )}
                >
                  {z.n}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{z.name}</span>
                <span className="shrink-0 text-xs text-muted">{z.floor === "ground" ? "Lantai dasar" : "Lantai 2"}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* selected zone */}
      <div ref={detailRef} className="order-first scroll-mt-24 lg:sticky lg:top-24 lg:order-none">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface/60">
          <div className="relative aspect-[16/10] bg-black">
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
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={cn("object-cover transition-opacity duration-500", i === photo ? "opacity-100" : "opacity-0")}
                priority={false}
              />
            ))}
            {active.photos.length > 1 ? (
              <>
                <button type="button" aria-label="Foto sebelumnya" onClick={() => step(-1)} className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75">
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button type="button" aria-label="Foto berikutnya" onClick={() => step(1)} className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75">
                  <ChevronRight className="size-5" aria-hidden />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
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

          <div className="p-5 sm:p-7">
            <p className="font-label text-[0.75rem] uppercase tracking-[0.28em] text-cyan">
              Zona {active.n} · {floorLabels[active.floor]}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{active.name}</h3>
            <p className="mt-3 text-base leading-8 text-ink-soft">{active.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5">
              <Link href="/booking" className="inline-flex items-center gap-2 rounded-pill bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-bold text-canvas transition hover:opacity-90">
                {cta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              {address ? (
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-sm text-ink-soft hover:text-ink">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />
                  <span>{address}</span>
                </a>
              ) : null}
            </div>
          </div>
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
