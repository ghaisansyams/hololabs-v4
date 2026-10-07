"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Quality } from "@/lib/quality";
import { scrollState } from "@/lib/scroll";

const LAYER_COLORS = ["#22d3ff", "#8b5cf6", "#f02fc2"];

/**
 * Scene 03 — tiga bidang kaca yang terurai lalu menumpuk kembali.
 *
 * Mewakili transparent, overlapping, dan layered pada compro halaman 4:
 * integrasi yang menghasilkan pengalaman lebih besar.
 */
export function GlassLayers({ tier }: { tier: Quality }) {
  const group = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    if (!group.current) return;
    // 0 saat scene mendekat, 1 saat lewat. Dipakai untuk mengurai tumpukan.
    const local = THREE.MathUtils.clamp((scrollState.progress - 0.2) / 0.12, 0, 1);
    const spread = Math.sin(local * Math.PI);

    group.current.rotation.y = -0.5 + state.clock.elapsedTime * 0.09;

    layers.current.forEach((mesh, i) => {
      if (!mesh) return;
      const offset = (i - 1) * spread;
      mesh.position.z = offset * 1.5;
      mesh.position.x = offset * 0.45;
      mesh.position.y = offset * 0.3;
    });
  });

  return (
    <group ref={group}>
      {LAYER_COLORS.map((color, i) => (
        <mesh
          key={color}
          ref={(el) => {
            layers.current[i] = el;
          }}
          position={[0, 0, (i - 1) * 0.25]}
        >
          <planeGeometry args={[3.2, 4.2]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.22}
            roughness={0.1}
            metalness={0.2}
            transmission={tier === "full" ? 0.6 : 0}
            thickness={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
