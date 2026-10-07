"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Pointer-driven 3D tilt: the card rotates toward the cursor and carries a
 * soft light glare, giving flat content (icons + text) real depth without a
 * 3D engine. Pure CSS transform + one pointermove listener per card.
 *
 * Disabled under prefers-reduced-motion (handled by the transition staying
 * off and rotation clamping to 0 there — see globals.css's reduced-motion
 * block, which zeroes transition-duration globally).
 */
export function TiltCard({
  children,
  className,
  max = 10,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
      </div>
    </div>
  );
}
