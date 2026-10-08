"use client";

import dynamic from "next/dynamic";

/**
 * Client-only load: @react-three/fiber's <Canvas> touches WebGL, which
 * doesn't exist during SSR/static generation.
 */
const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => null,
});

export function HeroSceneLoader() {
  return <HeroScene />;
}
