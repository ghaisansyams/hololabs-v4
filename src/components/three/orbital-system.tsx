"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Quality } from "@/lib/quality";

/**
 * Sistem orbit — pengganti empat lempeng kotak pada scene Ecosystem.
 *
 * Empat layer HOLOLABS (Immersive, Interactive, Intelligent, Physical)
 * mengitari satu pusat. Metafora yang sama dengan compro — semuanya saling
 * terhubung — tetapi bergerak sendiri tanpa menunggu scroll.
 *
 * Biaya CPU-nya empat perhitungan posisi per frame. Sabuk debunya satu
 * objek Points yang hanya diputar, jadi tidak ada buffer yang ditulis ulang.
 */

interface Body {
  key: string;
  color: string;
  radius: number;
  size: number;
  speed: number;
  tilt: number;
}

const BODIES: Body[] = [
  { key: "immersive", color: "#22d3ff", radius: 2.6, size: 0.34, speed: 0.42, tilt: 0.0 },
  { key: "interactive", color: "#8b5cf6", radius: 3.9, size: 0.27, speed: 0.29, tilt: 0.22 },
  { key: "intelligent", color: "#2b6bff", radius: 5.1, size: 0.31, speed: 0.2, tilt: -0.16 },
  { key: "physical", color: "#f02fc2", radius: 6.4, size: 0.24, speed: 0.14, tilt: 0.3 },
];

function DustBelt({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color("#22d3ff"), new THREE.Color("#8b5cf6"), new THREE.Color("#f02fc2")];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Sabuk tipis di antara orbit terluar, bukan bola acak: bentuk cakram
      // itulah yang membuat sistemnya terbaca sebagai tata surya.
      const radius = 7.1 + Math.random() * 1.9;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

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
    if (points.current) points.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function OrbitalSystem({ tier }: { tier: Quality }) {
  const group = useRef<THREE.Group>(null);
  const bodies = useRef<(THREE.Mesh | null)[]>([]);

  // Satu geometri bola dipakai ulang keempat benda; ukurannya diatur lewat
  // scale, bukan dengan membuat empat geometri berbeda.
  const sphere = useMemo(
    () => new THREE.SphereGeometry(1, tier === "full" ? 24 : 12, tier === "full" ? 18 : 10),
    [tier],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    BODIES.forEach((body, i) => {
      const mesh = bodies.current[i];
      if (!mesh) return;
      const angle = t * body.speed + i * 1.7;
      mesh.position.set(
        Math.cos(angle) * body.radius,
        Math.sin(angle) * body.radius * Math.sin(body.tilt),
        Math.sin(angle) * body.radius * Math.cos(body.tilt),
      );
    });

    if (group.current) group.current.rotation.y = t * 0.05;
  });

  return (
    <group ref={group} rotation={[0.42, 0, 0.38]}>
      {/* Pusat: inti yang memancar. Sengaja kecil — bintang yang terlalu
          besar menenggelamkan orbitnya sendiri dan jadi sekadar bola putih. */}
      <mesh geometry={sphere} scale={0.42}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh geometry={sphere} scale={0.78}>
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight color="#8b5cf6" intensity={24} distance={18} />

      {BODIES.map((body, i) => (
        <group key={body.key}>
          {/* Jalur orbit: cincin tipis, satu draw call masing-masing. */}
          <mesh rotation={[Math.PI / 2 + body.tilt, 0, 0]}>
            <ringGeometry args={[body.radius - 0.012, body.radius + 0.012, 96]} />
            <meshBasicMaterial
              color={body.color}
              transparent
              opacity={0.22}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          <mesh
            ref={(el) => {
              bodies.current[i] = el;
            }}
            geometry={sphere}
            scale={body.size}
          >
            <meshStandardMaterial
              color={body.color}
              emissive={new THREE.Color(body.color)}
              emissiveIntensity={1.4}
              roughness={0.35}
              metalness={0.1}
            />
          </mesh>
        </group>
      ))}

      <DustBelt count={tier === "full" ? 1600 : 500} />
    </group>
  );
}
