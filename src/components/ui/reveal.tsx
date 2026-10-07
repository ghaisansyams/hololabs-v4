"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Memunculkan isi saat masuk layar.
 *
 * Memakai IntersectionObserver, bukan pustaka animasi: satu observer untuk
 * seluruh halaman jauh lebih murah daripada state animasi per elemen, dan
 * elemennya sudah ada di HTML sejak awal sehingga tetap terbaca bila
 * JavaScript gagal dimuat (PRD bagian 8, aturan 8).
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "li" | "section";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(18px)",
        transition: `opacity var(--holo-slow) var(--holo-ease) ${delay}ms, transform var(--holo-slow) var(--holo-ease) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
