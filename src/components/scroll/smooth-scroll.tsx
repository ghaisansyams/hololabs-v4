"use client";

import { useEffect } from "react";
import Lenis from "lenis";

import { useQuality } from "@/lib/quality";
import { maxScroll, scrollState } from "@/lib/scroll";

/**
 * Smooth scrolling (PRD bagian 5) plus satu sumber kebenaran posisi scroll.
 *
 * PRD bagian 8, aturan 3: smooth scrolling tidak boleh membajak gestur asli.
 * Lenis di sini hanya menghaluskan wheel; keyboard, Page Down, End, dan
 * anchor tetap memakai scroll bawaan browser, dan Lenis ikut menyesuaikan.
 * Saat tingkat kualitas "static" Lenis tidak dijalankan sama sekali.
 */
export function SmoothScroll() {
  const { tier, ready } = useQuality();

  useEffect(() => {
    if (!ready) return;

    const setProgress = (scroll: number, velocity: number) => {
      scrollState.viewport = window.innerHeight;
      scrollState.progress = Math.min(1, Math.max(0, scroll / maxScroll()));
      scrollState.velocity = velocity;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        scrollState.progress.toFixed(4),
      );
    };

    // Tanpa 3D, posisi scroll tetap dicatat untuk indikator progres.
    if (tier === "static") {
      const onScroll = () => setProgress(window.scrollY, 0);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Sentuhan dibiarkan asli: smooth scroll di mobile terasa lengket
      // dan mengganggu gestur sistem.
      syncTouch: false,
      autoRaf: false,
    });

    lenis.on("scroll", ({ scroll, velocity }: { scroll: number; velocity: number }) => {
      setProgress(scroll, velocity);
    });

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Anchor dari navigasi scene: dipindah ke Lenis supaya kamera ikut
    // bergerak mulus, bukan melompat (PRD bagian 6).
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      // Fokus dipindahkan supaya pembaca layar ikut berpindah.
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };

    document.addEventListener("click", onClick);
    setProgress(window.scrollY, 0);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [tier, ready]);

  return null;
}
