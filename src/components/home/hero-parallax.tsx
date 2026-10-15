"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * The hero background drifts slower than the page scrolls (classic
 * parallax) and dims slightly as it leaves view — the first motion cue on
 * the page, before any section's Reveal fires.
 */
export function HeroParallax({ src, alt }: { src: string; alt: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      // How far the hero has scrolled past the top of the viewport, 0..1.
      const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
      node.style.setProperty("--parallax-y", `${progress * 14}%`);
      node.style.setProperty("--parallax-opacity", `${1 - progress * 0.5}`);
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

  return (
    <div ref={wrapRef} className="hero-parallax absolute inset-0 -z-10 overflow-hidden">
      <div className="hero-parallax-layer absolute inset-0">
        <Image src={src} alt={alt} fill priority sizes="100vw" className="object-cover object-[65%_30%]" />
      </div>
    </div>
  );
}
