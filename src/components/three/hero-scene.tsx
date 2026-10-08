"use client";

import { Canvas } from "@react-three/fiber";
import { HologramGlobe } from "./hologram-globe";
import { ParticleField } from "./particle-field";

/**
 * Hero's 3D centerpiece. Mirrors the react-three-fiber setup from
 * ghaisansyams/personal-website (Canvas + a dotted globe + a drifting
 * particle field), recolored to Hololabs' cyan/magenta identity.
 */
export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#67e8f9" />
      <pointLight position={[-5, -3, -5]} intensity={1.6} color="#f0abfc" />
      <ParticleField count={500} radius={9} color="#a855f7" size={0.035} speed={0.012} />
      <HologramGlobe />
    </Canvas>
  );
}
