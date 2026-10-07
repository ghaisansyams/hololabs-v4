"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { bridgeGeometry, wingGeometry } from "./geometry";
import type { Quality } from "@/lib/quality";

const CYAN = "#22d3ff";
const BLUE = "#2b6bff";
const VIOLET = "#8b5cf6";
const MAGENTA = "#f02fc2";

interface Props {
  tier: Quality;
  /** 0–1, posisi pengunjung di dalam scene yang memegang logo ini. */
  progress: number;
  /** Seberapa jauh dua sayap memisah: 0 menyatu, 1 terbelah penuh. */
  split?: number;
  pointer?: React.RefObject<THREE.Vector2>;
}

/**
 * Logo H sebagai objek kaca.
 *
 * Bentuknya tetap: dua sayap dan jembatan jam pasir pada filosofi simbol H.
 * Yang berubah hanya cara kacanya dipalsukan — lihat catatan pada
 * glassProps di bawah.
 */
export function HoloH({ tier, progress, split = 0, pointer }: Props) {
  const group = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);

  const wing = useMemo(() => wingGeometry(), []);
  const bridge = useMemo(
    () => bridgeGeometry(1.35, 0.78, 0.17, tier === "full" ? 72 : 40, tier === "full" ? 40 : 20),
    [tier],
  );

  /**
   * Tanpa transmission, sengaja.
   *
   * `transmission > 0` pada MeshPhysicalMaterial membuat three.js merender
   * ulang seluruh scene ke render target terpisah setiap frame, supaya ada
   * yang bisa dilihat "menembus" kaca. Satu objek saja sudah melipatgandakan
   * beban gambar. Di sini kesan kaca dibangun dari metalness tinggi,
   * roughness rendah, dan pancaran warna brand — satu pass biasa, dan di GPU
   * lemah selisihnya besar sekali.
   */
  const glassProps = useMemo(
    () => ({
      metalness: 0.85,
      roughness: tier === "full" ? 0.16 : 0.3,
      envMapIntensity: tier === "full" ? 1.9 : 1.1,
      transparent: true,
      opacity: 0.92,
    }),
    [tier],
  );

  useFrame((state) => {
    if (!group.current) return;

    // Logo mengikuti kursor dalam batas 8 derajat (PRD bagian 6).
    const limit = THREE.MathUtils.degToRad(8);
    const px = pointer?.current?.x ?? 0;
    const py = pointer?.current?.y ?? 0;

    const idle = state.clock.elapsedTime * 0.18;
    const targetY = Math.sin(idle) * 0.12 + px * limit + progress * Math.PI * 0.55;
    const targetX = Math.cos(idle * 0.8) * 0.07 - py * limit;

    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 3, 0.016);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 3, 0.016);
    group.current.position.y = Math.sin(idle * 1.3) * 0.08;

    // Dua sisi memisah lalu menyatu kembali — filosofi simbol H.
    const gap = 1.28 + split * 0.9;
    if (leftWing.current) leftWing.current.position.x = -gap;
    if (rightWing.current) rightWing.current.position.x = gap;
  });

  return (
    <group ref={group} dispose={null}>
      <mesh ref={leftWing} geometry={wing} position={[-1.28, 0, 0]} rotation={[0, 0.34, 0]}>
        <meshStandardMaterial
          {...glassProps}
          color={BLUE}
          emissive={new THREE.Color(CYAN)}
          emissiveIntensity={0.42}
          attach="material"
        />
      </mesh>

      <mesh geometry={bridge}>
        <meshStandardMaterial
          {...glassProps}
          color={VIOLET}
          emissive={new THREE.Color(VIOLET)}
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
          attach="material"
        />
      </mesh>

      <mesh ref={rightWing} geometry={wing} position={[1.28, 0, 0]} rotation={[0, -0.34, 0]}>
        <meshStandardMaterial
          {...glassProps}
          color={MAGENTA}
          emissive={new THREE.Color(MAGENTA)}
          emissiveIntensity={0.42}
          attach="material"
        />
      </mesh>

      {/* Rim light warna brand — membuat tepi kaca menyala seperti di compro. */}
      <pointLight position={[-3, 1.2, 2.4]} color={CYAN} intensity={tier === "full" ? 26 : 16} distance={12} />
      <pointLight position={[3, -1.2, 2.4]} color={MAGENTA} intensity={tier === "full" ? 26 : 16} distance={12} />
    </group>
  );
}
