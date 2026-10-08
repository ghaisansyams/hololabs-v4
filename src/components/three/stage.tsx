"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import { useQuality } from "@/lib/quality";
import { scrollState } from "@/lib/scroll";
import { HoloH } from "./holo-h";
import { ParticleField } from "./particles";
import { BlackHole } from "./blackhole";
import { OrbitalSystem } from "./orbital-system";
import { CORRIDOR_END, SceneAnchor } from "./scene-anchor";

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

    target.current.set(sway + pointer.current.x * 0.5, rise + pointer.current.y * 0.35, z);

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

/** Logo yang membelah mengikuti posisinya sendiri di layar. */
function SplittingLogo({
  tier,
  pointer,
}: {
  tier: ReturnType<typeof useQuality>["tier"];
  pointer: React.RefObject<THREE.Vector2>;
}) {
  const split = useRef(0);

  useFrame((state) => {
    // Terbuka paling lebar di tengah perjalanan scene, lalu menyatu lagi.
    split.current = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 0.5);
  });

  return <HoloH tier={tier} progress={0} split={split.current} pointer={pointer} />;
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

        frames={1}: cubemap-nya dirender sekali lalu dipakai terus. Lampu di
        dalamnya memang tidak bergerak, jadi merendernya tiap frame hanya
        membuang GPU. Resolusinya juga diturunkan — pantulan pada permukaan
        melengkung tidak menunjukkan selisih 256 dan 64, tetapi memorinya
        berbeda jauh.
      */}
      <Environment frames={1} resolution={tier === "full" ? 64 : 32}>
        <Lightformer form="rect" intensity={4} color="#22d3ff" position={[-5, 2, -2]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={4} color="#f02fc2" position={[5, -2, -2]} scale={[8, 8, 1]} />
        <Lightformer form="circle" intensity={2.4} color="#8b5cf6" position={[0, 4, 2]} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#05060a" position={[0, -5, 0]} scale={[20, 8, 1]} />
      </Environment>

      <ParticleField tier={tier} pointer={pointer} />

      {/*
        Tiap objek ditempelkan ke section-nya lewat SceneAnchor, yang membaca
        posisi nyata section itu di halaman. Versi sebelumnya menaruh objek
        pada jarak sama rata di koridor, seolah semua section sama tinggi —
        akibatnya sistem orbit tidak pernah sampai ke layar. Mengubah panjang
        teks dari dashboard admin kini juga tidak membuat objek melenceng.
      */}
      <SceneAnchor sceneKey="hero" x={3.6} y={0.15} distance={5} band={0.07}>
        <HoloH tier={tier} progress={scrollState.progress} pointer={pointer} />
      </SceneAnchor>

      <SceneAnchor sceneKey="essence" x={-3.4} y={0.5} distance={5} band={0.06}>
        <SplittingLogo tier={tier} pointer={pointer} />
      </SceneAnchor>

      <SceneAnchor sceneKey="integration" x={3.2} y={0.2} distance={13} band={0.07}>
        <BlackHole tier={tier} />
      </SceneAnchor>

      <SceneAnchor sceneKey="ecosystem" x={4.6} y={-0.2} distance={19} band={0.08}>
        <OrbitalSystem tier={tier} />
      </SceneAnchor>

      <SceneAnchor sceneKey="process" x={-3.2} y={0} distance={6} band={0.07}>
        <HoloH tier={tier} progress={scrollState.progress * 0.5} pointer={pointer} />
      </SceneAnchor>
    </>
  );
}

/**
 * Menghentikan render ketika tab tidak terlihat.
 *
 * requestAnimationFrame biasanya melambat sendiri di tab latar, tetapi tidak
 * selalu berhenti — dan di laptop, loop yang masih jalan berarti kipas tetap
 * berputar untuk gambar yang tidak dilihat siapa pun.
 */
function PauseWhenHidden() {
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setFrameloop("never");
      else {
        setFrameloop("always");
        invalidate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [invalidate, setFrameloop]);

  return null;
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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" style={{ contain: "strict" }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 48, near: 0.1, far: 220 }}
        // Dibatasi 1.5, bukan mengikuti devicePixelRatio penuh. Di layar
        // Retina selisihnya hampir tidak terlihat pada objek yang menyala dan
        // bergerak, sementara jumlah piksel yang digambar turun lebih dari
        // sepertiga.
        dpr={tier === "full" ? [1, 1.5] : [1, 1]}
        gl={{ antialias: tier === "full", powerPreference: "high-performance", alpha: true }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <PauseWhenHidden />
          <Corridor />
        </Suspense>
      </Canvas>
    </div>
  );
}
