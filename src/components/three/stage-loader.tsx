"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useQuality } from "@/lib/quality";

/**
 * Memuat mesin 3D belakangan, dan hanya kalau memang akan dipakai.
 *
 * three.js beserta drei adalah potongan JavaScript terbesar di project ini.
 * Kalau diimpor langsung, ia ikut di bundle halaman dan harus selesai diunduh
 * sebelum apa pun bisa dibaca — padahal teksnya sudah dirender server dan
 * tidak membutuhkannya sama sekali.
 *
 * Dua lapis penundaan: `ssr: false` mengeluarkannya dari render server, dan
 * flag di bawah menahan impornya sampai browser menganggur. Perangkat yang
 * jatuh ke mode static tidak pernah mengunduhnya sama sekali.
 */
const Stage = dynamic(() => import("./stage").then((m) => m.Stage), { ssr: false });

export function StageLoader() {
  const { tier, ready } = useQuality();
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!ready || tier === "static") return;

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const w = window as IdleWindow;

    // requestIdleCallback belum ada di Safari lama; timeout biasa cukup.
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setIdle(true), { timeout: 1500 });
      return () => {
        const cancel = (window as unknown as { cancelIdleCallback?: (h: number) => void })
          .cancelIdleCallback;
        cancel?.(id);
      };
    }

    const timer = window.setTimeout(() => setIdle(true), 400);
    return () => window.clearTimeout(timer);
  }, [ready, tier]);

  if (!ready || tier === "static" || !idle) return null;
  return <Stage />;
}
