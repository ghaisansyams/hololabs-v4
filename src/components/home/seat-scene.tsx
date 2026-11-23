"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { neutralMatcap } from "@/components/home/stage/prints";

/**
 * Reservation illustration: the show room in 3D. One curved row of 18 seats
 * faces an immersive wrap-around screen. The section's scroll progress drives
 * it: the camera swings round the room, the seats rise one by one from the
 * middle out, the screen lights up and seats fill until a few are left
 * glowing. Pointer movement adds a little parallax. Rendering pauses while
 * the canvas is off screen; reduced motion shows the settled state.
 */

const SEATS = 18;
const FILLED = 12;
// order in which the illustration fills seats (fixed so it reads the same each visit)
const FILL_ORDER = [8, 3, 13, 10, 5, 15, 1, 11, 6, 16, 0, 9, 4, 14, 2, 17, 7, 12];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const backOut = (v: number) => {
  const t = clamp(v) - 1;
  return 1 + t * t * (2.6 * t + 1.6);
};

const SCREEN_FRAG = /* glsl */ `
uniform float uTime;
uniform float uLight;
varying vec2 vUv;
void main() {
  vec2 p = vUv * vec2(6.0, 2.0);
  float t = uTime * 0.25;
  float n = sin(p.x * 1.3 + t * 2.0) + sin(p.y * 2.1 - t * 1.6) + sin((p.x + p.y) * 1.7 + t);
  n += sin(length(p - vec2(3.0 + sin(t) * 2.0, 1.0)) * 3.0 - t * 4.0);
  vec3 a = vec3(0.30, 0.10, 0.75);
  vec3 b = vec3(0.10, 0.75, 0.95);
  vec3 c = vec3(0.85, 0.25, 0.85);
  vec3 col = mix(a, b, 0.5 + 0.5 * sin(n));
  col = mix(col, c, (0.5 + 0.5 * sin(n * 0.7 + 1.5)) * 0.35);
  col *= 0.9 + 0.1 * smoothstep(0.3, 0.7, abs(fract(vUv.y * 36.0) - 0.5) * 2.0);
  float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
  float lit = 0.12 + 0.88 * uLight;
  gl_FragColor = vec4(col * edge * lit, 1.0);
  #include <colorspace_fragment>
}`;

export function SeatScene({ note }: { note?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(SEATS);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = wrap.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "absolute inset-0 size-full";
    host.prepend(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const track = <D extends { dispose: () => void }>(d: D) => {
      disposables.push(d);
      return d;
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07041a, 11, 22);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    const target = new THREE.Vector3(0, 0.55, -2.7);

    // soft round sprite for glows and particles
    const dotCanvas = document.createElement("canvas");
    dotCanvas.width = dotCanvas.height = 64;
    const dg = dotCanvas.getContext("2d")!;
    const grad = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    dg.fillStyle = grad;
    dg.fillRect(0, 0, 64, 64);
    const dot = track(new THREE.CanvasTexture(dotCanvas));
    const matcap = neutralMatcap({ track });

    // floor with glowing rings
    const floor = new THREE.Mesh(
      track(new THREE.CircleGeometry(4.6, 96)),
      track(new THREE.MeshBasicMaterial({ color: 0x0c0724 })),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -1.6;
    scene.add(floor);
    const ringMat = (color: number, opacity: number) =>
      track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    for (const [r, c, o] of [
      [2.2, 0x67e8f9, 0.55],
      [2.75, 0x8b5cf6, 0.35],
      [3.6, 0x67e8f9, 0.18],
    ] as const) {
      const ring = new THREE.Mesh(track(new THREE.RingGeometry(r - 0.012, r + 0.012, 160)), ringMat(c, o));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.005;
      scene.add(ring);
    }

    // wrap-around screen beyond the seats
    const SCREEN_R = 3.5;
    const screenMat = track(
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uLight: { value: 0 } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: SCREEN_FRAG,
        side: THREE.BackSide,
      }),
    );
    const screen = new THREE.Mesh(track(new THREE.CylinderGeometry(SCREEN_R, SCREEN_R, 1.9, 96, 1, true, Math.PI - 1.45, 2.9)), screenMat);
    screen.position.y = 1.05;
    scene.add(screen);
    const screenGlow = new THREE.Sprite(
      track(new THREE.SpriteMaterial({ map: dot, color: 0x7c3aed, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    screenGlow.scale.set(9, 4.5, 1);
    screenGlow.position.set(0, 1.1, -3.9);
    scene.add(screenGlow);

    // one curved row of seats facing the screen
    const SEAT_R = 2.2;
    const SPAN = 2.55;
    const cushionGeo = track(new RoundedBoxGeometry(0.27, 0.09, 0.27, 3, 0.035));
    const backGeo = track(new RoundedBoxGeometry(0.27, 0.32, 0.06, 3, 0.028));
    const baseGeo = track(new THREE.CylinderGeometry(0.035, 0.06, 0.18, 16));
    const availColor = new THREE.Color(0x22d3ee);
    const takenColor = new THREE.Color(0x6d28d9);
    const seats = Array.from({ length: SEATS }, (_, i) => {
      const theta = Math.PI - SPAN / 2 + (SPAN * i) / (SEATS - 1);
      const mat = track(new THREE.MeshMatcapMaterial({ matcap, color: availColor.clone() }));
      const seat = new THREE.Group();
      const base = new THREE.Mesh(baseGeo, mat);
      base.position.y = 0.09;
      const cushion = new THREE.Mesh(cushionGeo, mat);
      cushion.position.y = 0.22;
      const back = new THREE.Mesh(backGeo, mat);
      back.position.set(0, 0.39, 0.12);
      back.rotation.x = -0.12;
      seat.add(base, cushion, back);
      const pivot = new THREE.Group();
      pivot.position.set(Math.sin(theta) * SEAT_R, 0, Math.cos(theta) * SEAT_R);
      pivot.rotation.y = theta + Math.PI;
      pivot.add(seat);
      scene.add(pivot);
      const beacon = new THREE.Sprite(
        track(new THREE.SpriteMaterial({ map: dot, color: 0x67e8f9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      beacon.scale.setScalar(0.55);
      beacon.position.set(pivot.position.x, 0.55, pivot.position.z);
      scene.add(beacon);
      const fromMiddle = Math.abs(i - (SEATS - 1) / 2) / ((SEATS - 1) / 2);
      return { seat, mat, beacon, delay: fromMiddle, taken: 0 };
    });
    const fillRank = new Array<number>(SEATS);
    FILL_ORDER.forEach((seatIndex, rank) => (fillRank[seatIndex] = rank));

    // particles drifting up from the seats that are still free
    const PN = 120;
    const pPos = new Float32Array(PN * 3);
    const pSeed = Array.from({ length: PN }, () => [Math.floor(Math.random() * SEATS), Math.random(), (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25]);
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = track(
      new THREE.PointsMaterial({ map: dot, size: 0.07, color: 0x99f6e4, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    scene.add(new THREE.Points(pGeo, pMat));

    // holographic rings floating in front of the screen
    const holo = new THREE.Group();
    const holoMat = ringMat(0x67e8f9, 0.8);
    const holoMat2 = ringMat(0xe879f9, 0.7);
    const h1 = new THREE.Mesh(track(new THREE.TorusGeometry(0.42, 0.012, 8, 96)), holoMat);
    const h2 = new THREE.Mesh(track(new THREE.TorusGeometry(0.3, 0.01, 8, 96)), holoMat2);
    const core = new THREE.Sprite(
      track(new THREE.SpriteMaterial({ map: dot, color: 0xa5f3fc, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    core.scale.setScalar(0.5);
    holo.add(h1, h2, core);
    holo.position.set(0, 1.25, -3.05);
    scene.add(holo);

    // sizing
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // scroll progress of the section through the viewport, eased
    let goal = reduced ? 0.85 : 0;
    let prog = goal;
    const readScroll = () => {
      if (reduced) return;
      // 0 when the canvas peeks in at the bottom, about 0.9 once it is centred
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      goal = clamp((vh - r.top) / (vh * 0.6 + r.height * 0.5));
    };
    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      pointer.tx = 0;
      pointer.ty = 0;
    };
    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(host);

    let lastLeft = SEATS;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    function frame(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += reduced ? 0 : dt;
      prog += (goal - prog) * Math.min(1, dt * 4);
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
      const p = prog;

      // camera swings from a low side view to a high three-quarter view
      const az = -0.9 + 1.0 * smooth(p / 0.9) + pointer.x * 0.12 + (reduced ? 0 : Math.sin(time * 0.2) * 0.04);
      const el = 0.2 + 0.36 * smooth(p / 0.85) - pointer.y * 0.06;
      const dist = 13.5 - 1.8 * smooth(p);
      camera.position.set(target.x + Math.sin(az) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, target.z + Math.cos(az) * Math.cos(el) * dist);
      camera.lookAt(target);

      // seats rise from the middle outward, then fill until a few stay free
      const filled = Math.round(FILLED * smooth((p - 0.4) / 0.4));
      let free = 0;
      for (let i = 0; i < SEATS; i++) {
        const s = seats[i];
        const rise = backOut((p - 0.05 - s.delay * 0.25) / 0.2);
        s.seat.scale.set(1, Math.max(0.001, rise), 1);
        s.seat.position.y = (1 - clamp(rise)) * -0.3;
        const isTaken = fillRank[i] < filled ? 1 : 0;
        if (!isTaken) free++;
        s.taken += (isTaken - s.taken) * Math.min(1, dt * 6);
        s.mat.color.copy(availColor).lerp(takenColor, s.taken);
        const pulse = 0.55 + 0.45 * Math.sin(time * 3 + i);
        (s.beacon.material as THREE.SpriteMaterial).opacity = (1 - s.taken) * clamp(rise) * pulse * 0.75;
      }
      if (free !== lastLeft) {
        lastLeft = free;
        setLeft(free);
      }

      const light = smooth((p - 0.15) / 0.45);
      screenMat.uniforms.uLight.value = light;
      screenMat.uniforms.uTime.value = time;
      (screenGlow.material as THREE.SpriteMaterial).opacity = light * 0.55;

      for (let k = 0; k < PN; k++) {
        const s = pSeed[k];
        const seat = seats[s[0]];
        s[1] = (s[1] + dt * 0.25) % 1;
        const base = seat.beacon.position;
        pPos[k * 3] = base.x + s[2];
        pPos[k * 3 + 1] = 0.25 + s[1] * 1.6;
        pPos[k * 3 + 2] = base.z + s[3];
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = 0.2 + 0.7 * (free / SEATS) * light + 0.1;

      h1.rotation.set(time * 0.8, time * 0.5, 0);
      h2.rotation.set(-time * 0.6, 0, time * 0.9);
      holo.position.y = 1.25 + Math.sin(time * 1.3) * 0.06;
      holo.scale.setScalar(0.4 + 0.6 * light);

      renderer.render(scene, camera);
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", readScroll);
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onLeave);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <figure className="mx-auto w-full max-w-md">
      <div ref={wrap} className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_35%,#2a1458_0%,#0b0620_60%,#07041a_100%)] shadow-lift">
        {failed ? (
          <div aria-hidden className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
            18 kursi · 1 show
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <p className="rounded-full border border-cyan/40 bg-[#07041a]/70 px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cyan backdrop-blur-sm">
            <span className="tabular-nums text-ink">{left}</span> / {SEATS} kursi tersedia
          </p>
        </div>
        <ul className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
          <li className="flex items-center gap-1.5 rounded-full bg-[#07041a]/70 px-2.5 py-1 text-ink-soft backdrop-blur-sm">
            <span aria-hidden className="size-2 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" />
            Tersedia
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-[#07041a]/70 px-2.5 py-1 text-ink-soft backdrop-blur-sm">
            <span aria-hidden className="size-2 rounded-full bg-[#6d28d9]" />
            Terisi
          </li>
        </ul>
      </div>
      {note ? <figcaption className="mt-4 text-center text-xs font-medium text-muted">{note}</figcaption> : null}
    </figure>
  );
}
