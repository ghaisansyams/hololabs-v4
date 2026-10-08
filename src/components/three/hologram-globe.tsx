"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Evenly distributed points on a sphere — same method as personal-website's Globe. */
function fibonacciSphere(samples: number, radius: number) {
  const points: number[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    points.push(x * radius, y * radius, z * radius);
  }
  return new Float32Array(points);
}

/** Split a fibonacci sphere's points into two halves by x, for a two-tone brand gradient. */
function splitByHemisphere(positions: Float32Array) {
  const cyan: number[] = [];
  const magenta: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    (x < 0 ? cyan : magenta).push(positions[i], positions[i + 1], positions[i + 2]);
  }
  return { cyan: new Float32Array(cyan), magenta: new Float32Array(magenta) };
}

/**
 * The exhibition's "hologram" centerpiece: a dotted sphere (cyan on one
 * side, magenta on the other — the same split as the Hololabs mark) inside
 * a faint wireframe shell, projected up from a slowly spinning ring at its
 * base like a holographic emitter.
 */
export function HologramGlobe() {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const target = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  const { cyan, magenta } = useMemo(() => splitByHemisphere(fibonacciSphere(700, 2.05)), []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
      target.current.x = (state.pointer.x * Math.PI) / 10;
      target.current.y = (state.pointer.y * Math.PI) / 16;
      group.current.rotation.x += (target.current.y - group.current.rotation.x) * 0.04;
      group.current.position.x +=
        (target.current.x * (size.width > 768 ? 1 : 0.4) - group.current.position.x) * 0.04;
    }
    if (ring.current) ring.current.rotation.z -= delta * 0.25;
  });

  return (
    <group ref={group}>
      {/* Outer wireframe shell */}
      <mesh>
        <sphereGeometry args={[2, 40, 40]} />
        <meshBasicMaterial color="#c084fc" wireframe transparent opacity={0.22} />
      </mesh>

      {/* Two-tone dotted sphere */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cyan, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#67e8f9" size={0.07} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[magenta, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#f0abfc" size={0.07} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </points>

      {/* Soft inner glow core */}
      <mesh>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color="#e9d5ff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Holographic emitter ring at the base */}
      <mesh ref={ring} position={[0, -2.35, 0]} rotation={[Math.PI / 2.1, 0, 0]}>
        <ringGeometry args={[1.7, 2.05, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -2.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.25, 64]} />
        <meshBasicMaterial color="#d946ef" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
