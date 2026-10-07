"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Quality } from "@/lib/quality";
import { scrollState } from "@/lib/scroll";

/** Empat layer ekosistem, urutannya sesuai compro halaman 18. */
const LAYERS = [
  { label: "immersive", color: "#22d3ff" },
  { label: "interactive", color: "#8b5cf6" },
  { label: "intelligent", color: "#2b6bff" },
  { label: "physical", color: "#f02fc2" },
];

/**
 * Scene 10 — empat lempeng isometrik yang menumpuk menjadi satu bangunan
 * saat pengunjung scroll melewatinya.
 *
 * Lampiran A mencatat model GLB bangunan ekosistem sebagai aset yang belum
 * diproduksi; sampai itu ada, bentuknya diwakili lempeng berlapis yang
 * membawa gagasan yang sama: terpisah di atas, menyatu di bawah.
 */
export function EcosystemStack({ tier }: { tier: Quality }) {
  const group = useRef<THREE.Group>(null);
  const plates = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    if (!group.current) return;
    const local = THREE.MathUtils.clamp((scrollState.progress - 0.6) / 0.14, 0, 1);

    // Kemiringan isometrik, berputar pelan supaya kedalamannya terbaca.
    group.current.rotation.x = -0.52;
    group.current.rotation.z = 0.18;
    group.current.rotation.y = state.clock.elapsedTime * 0.12;

    plates.current.forEach((plate, i) => {
      if (!plate) return;
      // Tersebar jauh saat mendekat, rapat menjadi satu saat dilewati.
      const gap = THREE.MathUtils.lerp(2.6, 0.72, local);
      plate.position.y = (LAYERS.length - 1 - i) * gap - 1.2;
      const material = (plate.children[0] as THREE.Mesh)?.material as THREE.MeshStandardMaterial;
      if (material) material.emissiveIntensity = 0.3 + local * 0.5;
    });
  });

  return (
    <group ref={group}>
      {LAYERS.map((layer, i) => (
        <group
          key={layer.label}
          ref={(el) => {
            plates.current[i] = el;
          }}
        >
          <mesh>
            <boxGeometry args={[4.2, 0.12, 3.0]} />
            <meshStandardMaterial
              color={layer.color}
              emissive={new THREE.Color(layer.color)}
              emissiveIntensity={0.35}
              transparent
              opacity={0.5}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
          {tier === "full" && (
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[4.24, 0.01, 3.04]} />
              <meshBasicMaterial color={layer.color} transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
