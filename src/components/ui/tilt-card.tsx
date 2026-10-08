"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const DUST_COLORS = ["#22d3ee", "#d946ef", "#a855f7"];

/** Deterministic-enough per-mount randomness — fine since this never runs during SSR. */
function useDust(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        left: `${Math.round(Math.random() * 100)}%`,
        top: `${Math.round(Math.random() * 100)}%`,
        duration: `${(4 + Math.random() * 3).toFixed(2)}s`,
        delay: `${(Math.random() * 4).toFixed(2)}s`,
        color: DUST_COLORS[i % DUST_COLORS.length],
      })),
    [count],
  );
}

/**
 * Pointer-driven 3D tilt: the card rotates toward the cursor and carries a
 * soft light glare, giving flat content (icons + text) real depth without a
 * 3D engine. Also layers a handful of drifting, twinkling "hologram dust"
 * particles (pure CSS) so every tilt surface on the site reads as part of
 * the same holographic visual language as the hero's WebGL globe.
 *
 * Disabled under prefers-reduced-motion (handled by the transition staying
 * off and rotation clamping to 0 there — see globals.css's reduced-motion
 * block, which zeroes transition/animation duration globally).
 */
export function TiltCard({
  children,
  className,
  max = 10,
  dust = 6,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  max?: number;
  /** Number of hologram dust particles; 0 disables them. */
  dust?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dustParticles = useDust(dust);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node || event.pointerType === "touch") return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * max * 2;
    const rotateX = (0.5 - py) * max * 2;
    node.style.setProperty("--tilt-x", `${rotateX}deg`);
    node.style.setProperty("--tilt-y", `${rotateY}deg`);
    node.style.setProperty("--glare-x", `${px * 100}%`);
    node.style.setProperty("--glare-y", `${py * 100}%`);
    node.style.setProperty("--glare-opacity", "1");
  }

  function onPointerLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    node.style.setProperty("--glare-opacity", "0");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("tilt-card", className)}
      style={{ perspective: "900px" }}
    >
      <div className="tilt-card-inner relative h-full">
        {children}
        <span aria-hidden className="tilt-glare" />
        {dustParticles.length > 0 ? (
          <span aria-hidden className="hologram-dust">
            {dustParticles.map((p) => (
              <span
                key={p.key}
                style={
                  {
                    left: p.left,
                    top: p.top,
                    "--dust-duration": p.duration,
                    "--dust-delay": p.delay,
                    "--dust-color": p.color,
                    color: p.color,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
