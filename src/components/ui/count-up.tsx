"use client";

import { useEffect, useRef, useState } from "react";

const NUMBER = /\d+(?:,\d+)?/g;

/**
 * Counts every number inside `value` up from 0 like a stopwatch the first
 * time it scrolls into view ("±90 min" -> "±0 min" ... "±90 min", and
 * "1–50" counts both ends). Non-numeric text is left alone. The server
 * markup already holds the final text, so it reads correctly without
 * JavaScript or under prefers-reduced-motion.
 */
export function CountUp({ value, duration = 1800, className }: { value: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = [...value.matchAll(NUMBER)].map((m) => Number(m[0].replace(",", ".")));
    if (targets.length === 0) return;
    const decimals = [...value.matchAll(NUMBER)].map((m) => (m[0].split(",")[1] ?? "").length);

    const render = (progress: number) => {
      let i = 0;
      setText(
        value.replace(NUMBER, () => {
          const n = targets[i] * progress;
          const out = n.toFixed(decimals[i]).replace(".", ",");
          i += 1;
          return out;
        }),
      );
    };

    let frame = 0;
    let started = false;
    const run = () => {
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        render(1 - Math.pow(1 - p, 3)); // ease-out cubic
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    render(0);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </span>
  );
}
