"use client";

import { useEffect, useState } from "react";

import { useQuality } from "@/lib/quality";
import { sceneNav } from "@/content/site";

/** Indikator progres scroll di tepi layar, gradien cyan ke magenta. */
export function ScrollProgress() {
  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-50 h-0.5 w-full bg-white/5"
    >
      <div
        className="h-full origin-left"
        style={{
          background: "var(--holo-gradient)",
          transform: "scaleX(var(--scroll-progress, 0))",
        }}
      />
    </div>
  );
}

/** Penanda scene yang melayang. Mengklik menggerakkan kamera, bukan melompat. */
export function SceneNav() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    // Dihitung dari posisi scroll, bukan IntersectionObserver.
    //
    // Observer memberi tahu section mana yang memotong layar, tetapi scene di
    // sini tingginya berbeda-beda dan beberapa lebih tinggi dari viewport,
    // sehingga "yang paling banyak terlihat" tidak selalu yang sedang dibaca.
    // Titik tengah layar jauh lebih jujur dan tidak pernah tertinggal saat
    // pengunjung melompat lewat penanda.
    const pick = () => {
      const middle = window.scrollY + window.innerHeight / 2;
      let current = sceneNav[0].key;
      for (const scene of sceneNav) {
        const el = document.getElementById(scene.key);
        if (!el) continue;
        if (el.offsetTop <= middle) current = scene.key;
      }
      setActive(current);
    };

    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, []);

  return (
    <nav
      aria-label="Navigasi scene"
      className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ul className="flex flex-col gap-1">
        {sceneNav.map((scene) => {
          const isActive = active === scene.key;
          return (
            <li key={scene.key}>
              <a
                href={`#${scene.key}`}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center justify-end gap-2 rounded px-2 py-1.5"
              >
                <span
                  className={`text-[11px] tracking-wide transition-opacity duration-300 ${
                    isActive ? "opacity-90" : "opacity-0 group-hover:opacity-70 group-focus:opacity-90"
                  }`}
                >
                  {scene.label}
                </span>
                <span
                  aria-hidden="true"
                  className="block h-px transition-all duration-300"
                  style={{
                    width: isActive ? 26 : 12,
                    background: isActive ? "var(--holo-gradient)" : "currentColor",
                    opacity: isActive ? 1 : 0.35,
                  }}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Tombol matikan efek 3D (PRD bagian 6).
 *
 * Pilihannya tersimpan di localStorage dan bertahan setelah halaman dimuat
 * ulang — salah satu butir checklist UAT.
 */
export function MotionToggle() {
  const { userDisabled3D, toggle3D, tier, detected, ready } = useQuality();
  if (!ready) return null;

  // Perangkat yang memang tidak mampu 3D tidak perlu ditawari tombolnya.
  if (detected === "static" && !userDisabled3D) return null;

  return (
    <button
      type="button"
      onClick={toggle3D}
      aria-pressed={userDisabled3D}
      className="fixed bottom-4 left-4 z-50 rounded-full border border-white/15 bg-black/55 px-3.5 py-2 text-[11px] tracking-wide text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white"
    >
      {userDisabled3D ? "Nyalakan efek 3D" : "Matikan efek 3D"}
      <span className="sr-only">
        {` — mode saat ini: ${tier}`}
      </span>
    </button>
  );
}

/**
 * Scene 00 — preloader.
 *
 * Hanya tampil saat kanvas 3D akan dipakai. Di mode static halaman langsung
 * terbaca, jadi menahan isi di balik layar pemuatan justru merugikan.
 */
export function Preloader() {
  const { tier, ready } = useQuality();
  const [done, setDone] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!ready || tier === "static") {
      setDone(true);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      // Naik cepat lalu melambat; selesai setelah window.load atau 2,2 detik,
      // mana yang lebih dulu, supaya tidak pernah menahan pengunjung.
      const t = Math.min(1, (performance.now() - start) / 2200);
      setPct(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);

    const onLoad = () => {
      setPct(100);
      window.setTimeout(() => setDone(true), 320);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, [ready, tier]);

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--holo-ink)] transition-opacity duration-500"
      role="status"
      aria-live="polite"
    >
      <div className="w-56 text-center">
        <p className="holo-display text-2xl tracking-[0.3em]">
          HOLO<span className="holo-gradient-text">LABS</span>
        </p>
        <div className="mt-5 h-px w-full bg-white/10">
          <div
            className="h-full transition-[width] duration-200"
            style={{ width: `${pct}%`, background: "var(--holo-gradient)" }}
          />
        </div>
        <p className="mt-3 text-[11px] tabular-nums text-white/40">{pct}%</p>
      </div>
    </div>
  );
}
