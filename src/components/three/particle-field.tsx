"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Ambient drifting dust, reused from the same pattern as ghaisansyams/
 * personal-website's ParticleField — a sphere of random points, slowly
 * self-rotating. Recolored here for Hololabs' cyan/magenta identity.
 */
function randomInSphere(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

export function ParticleField({
  count = 700,
  radius = 9,
  color = "#22d3ee",
  size = 0.045,
  speed = 0.02,
}: {
  count?: number;
  radius?: number;
  color?: string;
  size?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => randomInSphere(count, radius), [count, radius]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed;
    ref.current.rotation.x += delta * speed * 0.3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
