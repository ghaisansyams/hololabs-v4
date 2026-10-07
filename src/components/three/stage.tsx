"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import { useQuality } from "@/lib/quality";
import { scrollState } from "@/lib/scroll";
import { HoloH } from "./holo-h";
import { ParticleField } from "./particles";
import { GlassLayers } from "./glass-layers";
import { EcosystemStack } from "./ecosystem-stack";

/** Jarak antar-perhentian kamera di koridor, dalam satuan dunia. */
const SPACING = 16;
/** Urutan harus sama dengan urutan section di halaman. */
const ANCHORS = [
  "hero",
  "essence",
  "integration",
  "colors",
  "dna",
  "solutions",
  "ecosystem",
  "journey",
  "process",
  "contact",
] as const;

const CORRIDOR_END = (ANCHORS.length - 1) * SPACING;

function anchorZ(key: (typeof ANCHORS)[number]) {
  return -ANCHORS.indexOf(key) * SPACING;
}

/**
 * Satu kamera yang menyusuri koridor, bukan potongan halaman terpisah
 * (PRD bagian 5). Posisinya murni fungsi dari progres scroll, jadi scroll
 * mundur selalu mengembalikan keadaan persis seperti semula — syarat UAT
 * "scroll mundur tidak meninggalkan objek tersangkut".
 */
function CameraRig({ pointer }: { pointer: React.RefObject<THREE.Vector2> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const p = scrollState.progress;
    const z = 7 - p * CORRIDOR_END;

    // Goyangan halus menyamping supaya koridor terasa punya ruang,
    // ditambah geser kecil mengikuti kursor.
    const sway = Math.sin(p * Math.PI * 3.1) * 1.6;
    const rise = Math.cos(p * Math.PI * 2.2) * 0.9;

    target.current.set(
      sway + pointer.current.x * 0.5,
      rise + pointer.current.y * 0.35,
      z,
    );

    camera.position.lerp(target.current, 0.08);
    camera.lookAt(sway * 0.35, rise * 0.3, z - 8);
  });

  return null;
}

function PointerTracker({ pointer }: { pointer: React.RefObject<THREE.Vector2> }) {
  useFrame((state) => {
    // state.pointer sudah dinormalkan -1..1 oleh R3F dan ikut menangani
    // sentuhan, jadi tidak perlu listener sendiri.
    pointer.current.lerp(state.pointer, 0.08);
  });
  return null;
}

function Corridor() {
  const { tier } = useQuality();
  const pointer = useRef(new THREE.Vector2(0, 0));

  return (
    <>
      <PointerTracker pointer={pointer} />
      <CameraRig pointer={pointer} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} />

      {/*
        Lingkungan dibangun dari lightformer, bukan berkas .hdr.
        Lampiran A mencatat HDRI sebagai aset yang belum ada, dan cara ini
        tidak mengunduh apa pun sehingga anggaran 6 MB tetap utuh.
      */}
      <Environment resolution={tier === "full" ? 256 : 128}>
        <Lightformer form="rect" intensity={4} color="#22d3ff" position={[-5, 2, -2]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={4} color="#f02fc2" position={[5, -2, -2]} scale={[8, 8, 1]} />
        <Lightformer form="circle" intensity={2.4} color="#8b5cf6" position={[0, 4, 2]} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#05060a" position={[0, -5, 0]} scale={[20, 8, 1]} />
      </Environment>

      <ParticleField tier={tier} pointer={pointer} />

      {/*
        Scene 01 — Hero. Digeser ke kanan supaya tidak menabrak headline:
        kolom teks menempati sisi kiri (max-w-3xl), jadi logo mengisi ruang
        kosong di kanan seperti komposisi sampul compro.
      */}
      <group position={[3.6, 0.15, anchorZ("hero") - 4.5]} scale={0.95}>
        <HoloH tier={tier} progress={scrollState.progress} pointer={pointer} />
      </group>

      {/* Scene 02 — dua sisi logo memisah lalu menyatu. */}
      <group position={[-3.4, 0.5, anchorZ("essence") - 3]} scale={0.8}>
        <SplittingLogo tier={tier} pointer={pointer} />
      </group>

      {/* Scene 03 — bidang kaca transparan, overlapping, layered. */}
      <group position={[3.2, 0, anchorZ("integration") - 3]}>
        <GlassLayers tier={tier} />
      </group>

      {/* Scene 10 — empat layer ekosistem menumpuk. */}
      <group position={[2.0, -0.6, anchorZ("ecosystem") - 3]}>
        <EcosystemStack tier={tier} />
      </group>

      {/* Scene 12 — logo kembali untuk manifesto penutup. */}
      <group position={[-3.2, 0, anchorZ("process") - 5]} scale={0.85}>
        <HoloH tier={tier} progress={scrollState.progress * 0.5} pointer={pointer} />
      </group>
    </>
  );
}

/** Logo yang membelah mengikuti progres scroll di scene Brand Essence. */
function SplittingLogo({
  tier,
  pointer,
}: {
  tier: ReturnType<typeof useQuality>["tier"];
  pointer: React.RefObject<THREE.Vector2>;
}) {
  const split = useRef(0);
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    // Terbelah paling lebar saat scene berada di tengah layar, lalu menyatu.
    const local = THREE.MathUtils.clamp((scrollState.progress - 0.08) / 0.12, 0, 1);
    split.current = Math.sin(local * Math.PI);
    if (group.current) group.current.visible = local > 0.001 && local < 0.999;
  });

  return (
    <group ref={group}>
      <HoloH tier={tier} progress={0} split={split.current} pointer={pointer} />
    </group>
  );
}

/**
 * Kanvas 3D menempel di belakang seluruh halaman.
 *
 * `pointer-events: none` penting: seluruh teks, tautan, dan form tetap bisa
 * diklik dan di-tab, dan navigasi keyboard tidak pernah terjebak di dalam
 * kanvas (PRD bagian 8, aturan 7). Kanvas juga aria-hidden karena isinya
 * dekoratif — penjelasannya ada di teks tiap scene.
 */
export function Stage() {
  const { tier, ready } = useQuality();

  if (!ready || tier === "static") return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ contain: "strict" }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 48, near: 0.1, far: 200 }}
        dpr={tier === "full" ? [1, 1.75] : [1, 1.25]}
        gl={{
          antialias: tier === "full",
          powerPreference: "high-performance",
          alpha: true,
        }}
        // Render hanya saat ada perubahan tidak cocok di sini: scene selalu
        // bergerak mengikuti scroll dan waktu.
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Corridor />
        </Suspense>
      </Canvas>
    </div>
  );
}
