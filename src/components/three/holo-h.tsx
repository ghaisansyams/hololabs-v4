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
 * Di mode "full" kacanya memakai material fisik dengan transmission; di
 * "lite" transmission dimatikan karena menuntut render pass tambahan yang
 * menjatuhkan frame rate di GPU lemah (PRD bagian 5).
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

  const glassProps = useMemo(
    () =>
      tier === "full"
        ? {
            transmission: 0.92,
            thickness: 1.4,
            roughness: 0.08,
            metalness: 0.1,
            ior: 1.45,
            clearcoat: 1,
            clearcoatRoughness: 0.12,
            envMapIntensity: 2.2,
          }
        : {
            // Tanpa transmission: tampil sebagai kaca berwarna yang memancar,
            // bukan kaca tembus pandang. Jauh lebih murah.
            transmission: 0,
            opacity: 0.86,
            transparent: true,
            roughness: 0.22,
            metalness: 0.35,
            clearcoat: 0.6,
            envMapIntensity: 1.2,
          },
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
        <meshPhysicalMaterial {...glassProps} color={BLUE} attach="material" />
      </mesh>

      <mesh geometry={bridge}>
        <meshPhysicalMaterial
          {...glassProps}
          color={VIOLET}
          emissive={new THREE.Color(VIOLET)}
          emissiveIntensity={0.35}
          side={THREE.DoubleSide}
          attach="material"
        />
      </mesh>

      <mesh ref={rightWing} geometry={wing} position={[1.28, 0, 0]} rotation={[0, -0.34, 0]}>
        <meshPhysicalMaterial {...glassProps} color={MAGENTA} attach="material" />
      </mesh>

      {/* Rim light warna brand — membuat tepi kaca menyala seperti di compro. */}
      <pointLight position={[-3, 1.2, 2.4]} color={CYAN} intensity={tier === "full" ? 26 : 16} distance={12} />
      <pointLight position={[3, -1.2, 2.4]} color={MAGENTA} intensity={tier === "full" ? 26 : 16} distance={12} />
    </group>
  );
}
