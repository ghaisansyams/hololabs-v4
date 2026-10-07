"use client";

import { useEffect, useRef } from "react";
import { registerScene } from "@/lib/scroll";

/**
 * Pembungkus satu scene.
 *
 * Mendaftarkan posisinya supaya scene 3D tahu kapan dirinya di layar, dan
 * membawa deskripsi tersembunyi untuk pembaca layar — PRD bagian 8, aturan 5:
 * setiap scene menjelaskan isi visualnya bagi yang tidak melihatnya.
 */
export function Section({
  id,
  theme = "dark",
  describe,
  className = "",
  children,
}: {
  id: string;
  theme?: "dark" | "light";
  describe?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerScene(id, el);
    const onResize = () => registerScene(id, el);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [id]);

  return (
    <section
      ref={ref}
      id={id}
      data-scene={id}
      className={`relative ${theme === "light" ? "holo-light" : ""} ${className}`}
    >
      {describe ? <p className="sr-only">{describe}</p> : null}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({ index, children }: { index?: string; children: React.ReactNode }) {
  return (
    <p className="holo-eyebrow flex items-center gap-3">
      {index ? <span className="tabular-nums">{index}</span> : null}
      <span className="holo-rule inline-block h-px w-8 opacity-70" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function Display({
  children,
  accent,
  className = "",
}: {
  children: React.ReactNode;
  accent?: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`holo-display text-4xl sm:text-5xl lg:text-6xl ${className}`}>
      {children}
      {accent ? (
        <>
          {" "}
          <span className="holo-gradient-text">{accent}</span>
        </>
      ) : null}
    </h2>
  );
}
