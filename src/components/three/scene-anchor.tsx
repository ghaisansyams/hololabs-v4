"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { scrollState, sceneCenterProgress } from "@/lib/scroll";

/**
 * Menempelkan objek 3D pada satu section HTML.
 *
 * Posisi z-nya dihitung dari posisi nyata section di halaman, bukan dari
 * urutannya. Jadi objek selalu berada di depan kamera persis ketika
 * section-nya terbaca, berapa pun tinggi section lain, dan tetap benar
 * setelah teksnya diubah dari dashboard admin.
 */
export function SceneAnchor({
  sceneKey,
  x = 0,
  y = 0,
  distance = 9,
  /** Lebar pita progres tempat objek terlihat. */
  band = 0.09,
  children,
}: {
  sceneKey: string;
  x?: number;
  y?: number;
  distance?: number;
  band?: number;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    const center = sceneCenterProgress(sceneKey);
    const cameraZ = 7 - center * CORRIDOR_END;
    g.position.set(x, y, cameraZ - distance);

    // Memudar mengikuti jarak dari pusat section, bukan ambang yang
    // ditulis tangan per scene.
    const away = Math.abs(scrollState.progress - center) / band;
    const fade = THREE.MathUtils.clamp(1 - away, 0, 1);
    g.visible = fade > 0.01;
    g.scale.setScalar(0.72 + fade * 0.4);
  });

  return <group ref={group}>{children}</group>;
}

/** Panjang koridor; harus sama dengan nilai di stage.tsx. */
export const CORRIDOR_END = 144;
