"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { Quality } from "@/lib/quality";

/**
 * Black hole dengan accretion disk — pengganti tiga bidang kaca datar.
 *
 * Seluruh gerakannya terjadi di GPU lewat satu uniform waktu: tidak ada
 * posisi yang dihitung ulang di JavaScript tiap frame, dan tidak ada
 * geometri yang disentuh setelah dibuat. Biayanya tiga draw call, tetap
 * sama baik piringannya diam maupun berputar kencang.
 *
 * Kenapa piringan, bukan bola bertekstur: tekstur berarti berkas yang harus
 * diunduh. Pola gasnya dihitung dari koordinat polar, jadi nol byte jaringan.
 */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  uniform vec3 uMagenta;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x);

    // Rotasi Kepler: makin dekat pusat, makin cepat. Inilah yang membuat
    // piringannya terlihat terpuntir, bukan sekadar berputar kaku.
    float speed = 0.5 / pow(max(r, 0.08), 1.5);
    float swirl = a + uTime * speed;

    float bandA = 0.5 + 0.5 * sin(swirl * 3.0 + r * 18.0 - uTime * 0.6);
    float bandB = 0.5 + 0.5 * sin(swirl * 7.0 - r * 31.0 + uTime * 0.9);
    float density = mix(bandA, bandB, 0.45);

    float inner = smoothstep(0.26, 0.36, r);
    float outer = 1.0 - smoothstep(0.70, 1.0, r);
    float alpha = inner * outer * (0.22 + density * 0.78);

    // Doppler beaming: sisi yang bergerak mendekat terlihat lebih terang.
    float doppler = 0.5 + 0.5 * cos(a);

    vec3 col = mix(uCyan, uViolet, smoothstep(0.30, 0.60, r));
    col = mix(col, uMagenta, smoothstep(0.60, 1.0, r));
    col *= 0.55 + doppler * 1.15;

    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

/** Cincin foton: lengkung tipis yang selalu menghadap kamera. */
const RING_FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uCyan;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float ring = smoothstep(0.40, 0.44, r) * (1.0 - smoothstep(0.46, 0.54, r));
    float shimmer = 0.85 + 0.15 * sin(uTime * 2.0 + atan(p.y, p.x) * 6.0);
    gl_FragColor = vec4(uCyan * 1.6 * shimmer, ring * uOpacity);
  }
`;

export function BlackHole({ tier }: { tier: Quality }) {
  const group = useRef<THREE.Group>(null);
  const disk = useRef<THREE.ShaderMaterial>(null);
  const ring = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uCyan: { value: new THREE.Color("#22d3ff") },
      uViolet: { value: new THREE.Color("#8b5cf6") },
      uMagenta: { value: new THREE.Color("#f02fc2") },
    }),
    [],
  );

  const ringUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uCyan: { value: new THREE.Color("#22d3ff") },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    ringUniforms.uTime.value = t;

    if (group.current) {
      // Miring pelan supaya piringannya terbaca sebagai bidang di ruang,
      // bukan lingkaran datar di layar.
      group.current.rotation.z = Math.sin(t * 0.08) * 0.12;
    }

    void disk;
    void ring;
  });

  const segments = tier === "full" ? 1 : 1;

  return (
    <group ref={group}>
      {/* Piringan akresi, dimiringkan ke arah kamera. */}
      <mesh rotation={[-1.15, 0, 0]}>
        <planeGeometry args={[9, 9, segments, segments]} />
        <shaderMaterial
          ref={disk}
          vertexShader={VERTEX}
          fragmentShader={DISK_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cakrawala peristiwa: bola gelap yang menelan cahaya di belakangnya. */}
      <mesh>
        <sphereGeometry args={[1.05, tier === "full" ? 32 : 16, tier === "full" ? 24 : 12]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Cincin foton menghadap kamera. */}
      <mesh>
        <planeGeometry args={[6.4, 6.4]} />
        <shaderMaterial
          ref={ring}
          vertexShader={VERTEX}
          fragmentShader={RING_FRAGMENT}
          uniforms={ringUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
