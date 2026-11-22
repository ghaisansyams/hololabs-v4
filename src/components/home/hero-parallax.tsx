"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the hero photo and lets it drift down and fade a little as the page
 * scrolls away, so the photo sinks behind the journey instead of sliding up
 * flat. Transform/opacity only; off under reduced motion.
 */
export function HeroParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const h = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      el.style.transform = `translate3d(0, ${(p * 18).toFixed(2)}vh, 0)`;
      el.style.opacity = String(1 - p * 0.5);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 -z-20 will-change-transform">
      {children}
    </div>
  );
}
