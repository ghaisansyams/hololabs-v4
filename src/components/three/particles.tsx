"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Quality } from "@/lib/quality";

interface Props {
  tier: Quality;
  pointer?: React.RefObject<THREE.Vector2>;
}

/**
 * Bidang bintang yang membentang di sepanjang koridor.
 *
 * Turun dari 18.000 ke 7.000. Pada ukuran titik sekecil ini, menggandakan
 * jumlahnya tidak membuat langitnya terlihat lebih padat — yang bertambah
 * hanya 264 KB buffer GPU dan pekerjaan rasterisasi. Mode lite kini
 * mendapat 2.000, bukan nol: langit kosong terlihat seperti halaman rusak.
 */
export function ParticleField({ tier, pointer }: Props) {
  const points = useRef<THREE.Points>(null);
  const count = tier === "full" ? 7000 : 2000;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color("#22d3ff"), new THREE.Color("#8b5cf6"), new THREE.Color("#f02fc2")];

    for (let i = 0; i < count; i++) {
      // Disebar dalam tabung panjang mengelilingi jalur kamera, supaya
      // pengunjung merasa menembusnya, bukan melihatnya dari luar.
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 14;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.55;
      positions[i * 3 + 2] = -Math.random() * 150 + 10;

      const color = palette[i % palette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.elapsedTime;
    points.current.rotation.z = t * 0.012;
    // Bereaksi ke kursor dan sentuhan (PRD bagian 6).
    points.current.position.x = (pointer?.current?.x ?? 0) * 1.4;
    points.current.position.y = (pointer?.current?.y ?? 0) * -1.1;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.72}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
