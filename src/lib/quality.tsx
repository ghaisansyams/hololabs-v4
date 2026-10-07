"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Tiga tingkat kualitas — PRD bagian 5.
 *
 *  full   : WebGL2, memori >= 4 GB, bukan mode hemat data.
 *  lite   : WebGL2 tapi GPU lemah atau layar sempit.
 *  static : tanpa WebGL2, prefers-reduced-motion, atau koneksi lambat.
 *
 * Nilai awal "static" disengaja: server merender tanpa tahu kemampuan
 * perangkat, dan halaman harus tetap terbaca penuh bila JavaScript gagal
 * dimuat (PRD bagian 8, aturan 8). Kanvas 3D baru menyala setelah deteksi.
 */
export type Quality = "full" | "lite" | "static";

interface QualityState {
  tier: Quality;
  /** Tier yang dideteksi, sebelum pengguna memilih sendiri. */
  detected: Quality;
  reducedMotion: boolean;
  /** Pengguna mematikan efek 3D lewat tombol; tersimpan di localStorage. */
  userDisabled3D: boolean;
  toggle3D: () => void;
  ready: boolean;
}

const QualityContext = createContext<QualityState>({
  tier: "static",
  detected: "static",
  reducedMotion: false,
  userDisabled3D: false,
  toggle3D: () => {},
  ready: false,
});

const STORAGE_KEY = "holo:disable-3d";

function detectTier(): { tier: Quality; reduced: boolean } {
  if (typeof window === "undefined") return { tier: "static", reduced: false };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return { tier: "static", reduced };

  // WebGL2 — tanpa ini tidak ada scene 3D sama sekali.
  let hasWebGL2 = false;
  try {
    const canvas = document.createElement("canvas");
    hasWebGL2 = Boolean(canvas.getContext("webgl2"));
  } catch {
    hasWebGL2 = false;
  }
  if (!hasWebGL2) return { tier: "static", reduced };

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  const connection = nav.connection;
  if (connection?.saveData) return { tier: "static", reduced };
  if (connection?.effectiveType && /(^|-)(2g|3g)$/.test(connection.effectiveType)) {
    return { tier: "static", reduced };
  }

  // deviceMemory hanya ada di Chromium. Absennya bukan bukti perangkat lemah,
  // jadi yang tidak melaporkannya diperlakukan sebagai cukup.
  const memory = nav.deviceMemory ?? 8;
  const narrow = window.innerWidth < 768;
  if (memory < 4 || narrow) return { tier: "lite", reduced };

  return { tier: "full", reduced };
}

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<Quality>("static");
  const [detected, setDetected] = useState<Quality>("static");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userDisabled3D, setUserDisabled3D] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Mode penyamaran atau site data diblokir — anggap tidak pernah memilih.
    }

    const { tier: next, reduced } = detectTier();
    setDetected(next);
    setReducedMotion(reduced);
    setUserDisabled3D(stored);
    setTier(stored ? "static" : next);
    setReady(true);
  }, []);

  /**
   * Penurunan otomatis — PRD bagian 5: bila frame rate jatuh di bawah 24 FPS
   * selama 3 detik, turunkan satu tingkat. Pengukuran berhenti begitu sudah
   * di tingkat terendah supaya tidak membebani perangkat yang sudah berat.
   */
  const downgrade = useCallback(() => {
    setTier((current) => (current === "full" ? "lite" : current === "lite" ? "static" : current));
  }, []);

  const frames = useRef(0);
  const windowStart = useRef(0);
  const slowSince = useRef<number | null>(null);

  useEffect(() => {
    if (!ready || tier === "static") return;

    let raf = 0;
    frames.current = 0;
    windowStart.current = performance.now();
    slowSince.current = null;

    const tick = () => {
      frames.current += 1;
      const now = performance.now();
      const elapsed = now - windowStart.current;

      if (elapsed >= 1000) {
        const fps = (frames.current * 1000) / elapsed;
        frames.current = 0;
        windowStart.current = now;

        if (fps < 24) {
          if (slowSince.current === null) slowSince.current = now;
          else if (now - slowSince.current >= 3000) {
            downgrade();
            return;
          }
        } else {
          slowSince.current = null;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, tier, downgrade]);

  const toggle3D = useCallback(() => {
    setUserDisabled3D((wasDisabled) => {
      const nowDisabled = !wasDisabled;
      try {
        window.localStorage.setItem(STORAGE_KEY, nowDisabled ? "1" : "0");
      } catch {
        // Tidak bisa disimpan; pilihannya tetap berlaku untuk sesi ini.
      }
      setTier(nowDisabled ? "static" : detectTier().tier);
      return nowDisabled;
    });
  }, []);

  const value = useMemo(
    () => ({ tier, detected, reducedMotion, userDisabled3D, toggle3D, ready }),
    [tier, detected, reducedMotion, userDisabled3D, toggle3D, ready],
  );

  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>;
}

export function useQuality() {
  return useContext(QualityContext);
}
