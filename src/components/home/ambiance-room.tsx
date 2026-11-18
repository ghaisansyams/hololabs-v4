"use client";

import { useEffect, useRef } from "react";

const BASE_X = -3;
const BASE_Y = -12;

/**
 * A walk-in room built from CSS 3D planes: back wall with a lit doorway,
 * glass side walls, a reflective floor with LED strips and floating glass
 * slabs. It answers the pointer (tilt) and the page scroll (the camera
 * drifts forward and the slabs slide), both written straight to CSS
 * variables from rAF-throttled listeners so React never re-renders.
 * There is no looping animation.
 */
export function AmbianceRoom({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      node.style.setProperty("--slide", p.toFixed(3));
      node.style.setProperty("--dz", (p * 7).toFixed(2));
      node.style.setProperty("--sy", ((p - 0.45) * 16).toFixed(2));
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

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node || event.pointerType === "touch") return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--py", String(BASE_Y + x * 14));
    node.style.setProperty("--px", String(BASE_X - y * 10));
  }

  function onPointerLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--py", String(BASE_Y));
    node.style.setProperty("--px", String(BASE_X));
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="amb-stage mx-auto w-full max-w-[34rem]"
      style={{ "--px": BASE_X, "--py": BASE_Y } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-[8%] rounded-full bg-brand/25 blur-[70px]"
      />
      <div aria-hidden className="amb-scene">
        <div className="amb-rig">
          <div className="amb-room">
            <div className="amb-face amb-back">
              <div className="amb-door" />
            </div>
            <div className="amb-face amb-left" />
            <div className="amb-face amb-right" />
            <div className="amb-face amb-ceiling" />
            <div className="amb-face amb-floor" />
            <div className="amb-slab amb-slab-1" />
            <div className="amb-slab amb-slab-2" />
            <div className="amb-slab amb-slab-3" />
            <div className="amb-figure" />
          </div>
        </div>
      </div>
    </div>
  );
}
