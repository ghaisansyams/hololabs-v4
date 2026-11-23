"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Reservation illustration: an isometric miniature of the HOLOLABS show
 * room. A round glowing platform carries a curved LED wall, a hologram
 * stage in the middle and one curved row of 18 cinema chairs facing the
 * wall. The section's scroll progress builds it: the wall rises, the chairs
 * drop into place from the centre out, the wall and hologram light up, and
 * chairs fill until six stay free. Pointer movement turns the model a
 * little. Rendering pauses off screen; reduced motion shows the end state.
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
  return 1 + t * t * (2.4 * t + 1.4);
};

const WALL_FRAG = /* glsl */ `
uniform float uTime;
uniform float uLight;
varying vec2 vUv;
void main() {
  vec2 p = vUv * vec2(7.0, 2.2);
  float t = uTime * 0.3;
  float n = sin(p.x * 1.2 + t * 1.8) + sin(p.y * 2.3 - t * 1.4) + sin((p.x + p.y) * 1.6 + t);
  n += sin(length(p - vec2(3.5 + sin(t * 0.7) * 2.5, 1.1)) * 3.2 - t * 3.5);
  vec3 a = vec3(0.24, 0.08, 0.62);
  vec3 b = vec3(0.08, 0.72, 0.92);
  vec3 c = vec3(0.86, 0.28, 0.86);
  vec3 col = mix(a, b, 0.5 + 0.5 * sin(n));
  col = mix(col, c, (0.5 + 0.5 * sin(n * 0.7 + 1.5)) * 0.4);
  // LED panel seams
  float seam = step(0.04, fract(vUv.x * 16.0)) * step(0.05, fract(vUv.y * 4.0));
  col *= 0.55 + 0.45 * seam;
  float fade = smoothstep(0.0, 0.18, vUv.y) * (0.75 + 0.25 * smoothstep(1.0, 0.7, vUv.y));
  float lit = 0.06 + 0.94 * uLight;
  gl_FragColor = vec4(col * fade * lit * 1.25, 1.0);
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "absolute inset-0 size-full";
    host.prepend(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const track = <D extends { dispose: () => void }>(d: D) => {
      disposables.push(d);
      return d;
    };
    const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
      track(new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15, ...extra }));
    const glow = (color: number, opacity = 1) =>
      track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const target = new THREE.Vector3(0, 1.0, 0);

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

    // lights
    scene.add(new THREE.HemisphereLight(0xb9a6ff, 0x0b0620, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(5, 9, 6);
    scene.add(key);
    const holoLight = new THREE.PointLight(0x67e8f9, 0, 7, 1.4);
    holoLight.position.set(0, 1.3, 0);
    const wallLight = new THREE.PointLight(0xd946ef, 0, 7, 1.4);
    wallLight.position.set(-1.6, 1.4, -1.6);
    scene.add(holoLight, wallLight);

    const root = new THREE.Group();
    scene.add(root);

    // platform with glowing rims
    const R = 3.6;
    const base = new THREE.Mesh(track(new THREE.CylinderGeometry(R, R + 0.15, 0.42, 96)), std(0x150b36, { roughness: 0.4, metalness: 0.35 }));
    base.position.y = -0.21;
    const rim = new THREE.Mesh(track(new THREE.TorusGeometry(R, 0.025, 8, 160)), glow(0x67e8f9, 0.95));
    rim.rotation.x = Math.PI / 2;
    const rimLow = new THREE.Mesh(track(new THREE.TorusGeometry(R + 0.15, 0.018, 8, 160)), glow(0x8b5cf6, 0.7));
    rimLow.rotation.x = Math.PI / 2;
    rimLow.position.y = -0.42;
    root.add(base, rim, rimLow);

    // floor grid
    const gridCanvas = document.createElement("canvas");
    gridCanvas.width = gridCanvas.height = 512;
    const gg = gridCanvas.getContext("2d")!;
    gg.strokeStyle = "rgba(167,139,250,0.35)";
    gg.lineWidth = 1.5;
    for (let i = 0; i <= 512; i += 32) {
      gg.beginPath();
      gg.moveTo(i, 0);
      gg.lineTo(i, 512);
      gg.moveTo(0, i);
      gg.lineTo(512, i);
      gg.stroke();
    }
    const fadeGrad = gg.createRadialGradient(256, 256, 60, 256, 256, 256);
    fadeGrad.addColorStop(0, "rgba(0,0,0,0)");
    fadeGrad.addColorStop(1, "rgba(0,0,0,1)");
    gg.globalCompositeOperation = "destination-out";
    gg.fillStyle = fadeGrad;
    gg.fillRect(0, 0, 512, 512);
    const floor = new THREE.Mesh(
      track(new THREE.CircleGeometry(R - 0.05, 96)),
      track(new THREE.MeshBasicMaterial({ map: track(new THREE.CanvasTexture(gridCanvas)), transparent: true, depthWrite: false })),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.005;
    root.add(floor);

    // curved LED wall at the back (away from the camera), rising from the floor
    const WALL_R = 3.25;
    const WALL_H = 2.5;
    const span = 3.3;
    const start = (5 * Math.PI) / 4 - span / 2;
    const wallGeo = track(new THREE.CylinderGeometry(WALL_R, WALL_R, WALL_H, 96, 1, true, start, span));
    wallGeo.translate(0, WALL_H / 2, 0);
    const wallMat = track(
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uLight: { value: 0 } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: WALL_FRAG,
        side: THREE.DoubleSide,
      }),
    );
    const wall = new THREE.Mesh(wallGeo, wallMat);
    const shellGeo = track(new THREE.CylinderGeometry(WALL_R + 0.08, WALL_R + 0.08, WALL_H + 0.08, 96, 1, true, start - 0.02, span + 0.04));
    shellGeo.translate(0, WALL_H / 2, 0);
    const shell = new THREE.Mesh(shellGeo, std(0x1c1145, { side: THREE.BackSide, roughness: 0.3, metalness: 0.5 }));
    const arcPts = Array.from({ length: 65 }, (_, i) => {
      const th = start + (span * i) / 64;
      return new THREE.Vector3(Math.sin(th) * (WALL_R + 0.04), WALL_H + 0.02, Math.cos(th) * (WALL_R + 0.04));
    });
    const wallTop = new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 96, 0.03, 8, false)), glow(0x67e8f9, 0.9));
    const wallRig = new THREE.Group();
    wallRig.add(shell, wall, wallTop);
    root.add(wallRig);

    // hologram stage in the middle
    const stage = new THREE.Group();
    const stageBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.62, 0.7, 0.14, 64)), std(0x22164f, { roughness: 0.3, metalness: 0.6 }));
    stageBase.position.y = 0.07;
    const stageRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.6, 0.02, 8, 96)), glow(0x67e8f9, 1));
    stageRing.rotation.x = Math.PI / 2;
    stageRing.position.y = 0.145;
    const beamGeo = track(new THREE.CylinderGeometry(0.12, 0.58, 1.5, 48, 1, true));
    beamGeo.translate(0, 0.9, 0);
    const beamMat = glow(0x67e8f9, 0.16);
    beamMat.side = THREE.DoubleSide;
    const beam = new THREE.Mesh(beamGeo, beamMat);
    const holoMat = glow(0xa5f3fc, 0.9);
    const holo = new THREE.LineSegments(
      track(new THREE.EdgesGeometry(track(new THREE.IcosahedronGeometry(0.42, 1)))),
      track(new THREE.LineBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    holo.position.y = 1.55;
    const core = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.2, 2)), holoMat);
    core.position.y = 1.55;
    const orbit = new THREE.Mesh(track(new THREE.TorusGeometry(0.62, 0.008, 6, 128)), glow(0xe879f9, 0.85));
    orbit.position.y = 1.55;
    const coreGlow = new THREE.Sprite(
      track(new THREE.SpriteMaterial({ map: dot, color: 0x67e8f9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    coreGlow.scale.setScalar(2.2);
    coreGlow.position.y = 1.55;
    stage.add(stageBase, stageRing, beam, holo, core, orbit, coreGlow);
    root.add(stage);

    // one curved row of 18 cinema chairs in front, facing the wall
    const SEAT_R = 2.3;
    const seatSpan = 2.75;
    const mid = Math.PI / 4;
    const cushionGeo = track(new RoundedBoxGeometry(0.22, 0.07, 0.2, 3, 0.03));
    const backGeo = track(new RoundedBoxGeometry(0.22, 0.28, 0.06, 3, 0.03));
    const armGeo = track(new RoundedBoxGeometry(0.035, 0.05, 0.19, 2, 0.015));
    const legGeo = track(new THREE.CylinderGeometry(0.03, 0.05, 0.13, 12));
    const availColor = new THREE.Color(0x22d3ee);
    const takenColor = new THREE.Color(0x6d28d9);
    const availEmissive = new THREE.Color(0x0e7490);
    const takenEmissive = new THREE.Color(0x1e0b45);
    const frameMat = std(0x241845, { roughness: 0.4, metalness: 0.5 });
    const seats = Array.from({ length: SEATS }, (_, i) => {
      const th = mid - seatSpan / 2 + (seatSpan * i) / (SEATS - 1);
      const mat = std(0x22d3ee, { emissive: 0x0e7490, emissiveIntensity: 0.6, roughness: 0.45 });
      const chair = new THREE.Group();
      const leg = new THREE.Mesh(legGeo, frameMat);
      leg.position.y = 0.065;
      const cushion = new THREE.Mesh(cushionGeo, mat);
      cushion.position.y = 0.165;
      const back = new THREE.Mesh(backGeo, mat);
      back.position.set(0, 0.32, -0.085);
      back.rotation.x = -0.1;
      const armL = new THREE.Mesh(armGeo, frameMat);
      armL.position.set(-0.13, 0.22, 0);
      const armR = armL.clone();
      armR.position.x = 0.13;
      chair.add(leg, cushion, back, armL, armR);
      const pivot = new THREE.Group();
      pivot.position.set(Math.sin(th) * SEAT_R, 0, Math.cos(th) * SEAT_R);
      pivot.rotation.y = th + Math.PI; // local +z faces the centre / wall
      chair.scale.setScalar(1.45);
      pivot.add(chair);
      root.add(pivot);
      const beacon = new THREE.Sprite(
        track(new THREE.SpriteMaterial({ map: dot, color: 0x67e8f9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      beacon.scale.setScalar(0.5);
      beacon.position.set(pivot.position.x, 0.75, pivot.position.z);
      root.add(beacon);
      const fromMiddle = Math.abs(i - (SEATS - 1) / 2) / ((SEATS - 1) / 2);
      return { chair, mat, beacon, delay: fromMiddle, taken: 0 };
    });
    const fillRank = new Array<number>(SEATS);
    FILL_ORDER.forEach((seatIndex, rank) => (fillRank[seatIndex] = rank));

    // particles rising from the hologram stage
    const PN = 90;
    const pPos = new Float32Array(PN * 3);
    const pSeed = Array.from({ length: PN }, () => [Math.random(), Math.random() * Math.PI * 2, 0.1 + Math.random() * 0.5]);
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = track(
      new THREE.PointsMaterial({ map: dot, size: 0.09, color: 0x99f6e4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    root.add(new THREE.Points(pGeo, pMat));

    // sizing: an orthographic camera framing the whole platform
    const VIEW = 8.2;
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.left = (-VIEW * aspect) / 2;
      camera.right = (VIEW * aspect) / 2;
      camera.top = VIEW / 2;
      camera.bottom = -VIEW / 2;
      camera.updateProjectionMatrix();
      if (reduced) requestAnimationFrame(frame);
    };

    // scroll progress of the illustration through the viewport, eased
    let goal = reduced ? 0.95 : 0;
    let prog = goal;
    const readScroll = () => {
      if (reduced) return;
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      goal = clamp((vh - r.top) / (vh * 0.6 + r.height * 0.5));
    };
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
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(frame);
    });

    let lastLeft = SEATS;
    let last = performance.now();
    let time = 0;
    function frame(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) time += dt;
      prog += (goal - prog) * Math.min(1, reduced ? 1 : dt * 4);
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
      const p = prog;

      // isometric-ish camera, the model turning a little with scroll and pointer
      const el = 0.6 - pointer.y * 0.05;
      camera.position.set(Math.cos(el) * 14 * Math.SQRT1_2, Math.sin(el) * 14 + target.y, Math.cos(el) * 14 * Math.SQRT1_2);
      camera.lookAt(target);
      root.rotation.y = -0.55 + 0.55 * smooth(p / 0.85) + pointer.x * 0.18 + (reduced ? 0 : Math.sin(time * 0.18) * 0.05);
      root.scale.setScalar(0.88 + 0.12 * smooth(p / 0.3));

      // wall rises, chairs drop in, lights come on, chairs fill
      const wallUp = smooth((p - 0.04) / 0.3);
      wallRig.scale.y = Math.max(0.001, wallUp);
      const light = smooth((p - 0.32) / 0.35);
      wallMat.uniforms.uLight.value = light;
      wallMat.uniforms.uTime.value = time;
      holoLight.intensity = 9 * light;
      wallLight.intensity = 7 * light;

      const filled = Math.round(FILLED * smooth((p - 0.55) / 0.35));
      let free = 0;
      for (let i = 0; i < SEATS; i++) {
        const s = seats[i];
        const drop = backOut((p - 0.18 - s.delay * 0.22) / 0.2);
        s.chair.position.y = (1 - clamp(drop)) * 1.2;
        s.chair.scale.setScalar(1.45 * Math.max(0.001, Math.min(drop, 1.08)));
        const isTaken = fillRank[i] < filled ? 1 : 0;
        if (!isTaken) free++;
        s.taken += (isTaken - s.taken) * Math.min(1, reduced ? 1 : dt * 6);
        s.mat.color.copy(availColor).lerp(takenColor, s.taken);
        s.mat.emissive.copy(availEmissive).lerp(takenEmissive, s.taken);
        s.mat.emissiveIntensity = 0.5 + 0.5 * light * (1 - s.taken);
        const pulse = 0.55 + 0.45 * Math.sin(time * 3 + i);
        (s.beacon.material as THREE.SpriteMaterial).opacity = (1 - s.taken) * clamp(drop) * light * pulse * 0.7;
      }
      if (free !== lastLeft) {
        lastLeft = free;
        setLeft(free);
      }

      // hologram
      const holoOn = smooth((p - 0.38) / 0.3);
      holo.scale.setScalar(Math.max(0.001, holoOn));
      core.scale.setScalar(Math.max(0.001, holoOn));
      orbit.scale.setScalar(Math.max(0.001, holoOn));
      holo.rotation.set(time * 0.5, time * 0.7, 0);
      orbit.rotation.set(Math.PI / 2 + 0.4 * Math.sin(time * 0.6), time * 0.4, 0);
      const bob = Math.sin(time * 1.4) * 0.05;
      holo.position.y = core.position.y = orbit.position.y = coreGlow.position.y = 1.55 + bob;
      (coreGlow.material as THREE.SpriteMaterial).opacity = 0.55 * holoOn;
      beamMat.opacity = 0.16 * holoOn;
      holoMat.opacity = 0.9 * holoOn;

      for (let k = 0; k < PN; k++) {
        const s = pSeed[k];
        if (!reduced) s[0] = (s[0] + dt * 0.22) % 1;
        const a = s[1] + time * 0.6;
        pPos[k * 3] = Math.cos(a) * s[2] * (1 - s[0] * 0.6);
        pPos[k * 3 + 1] = 0.15 + s[0] * 1.9;
        pPos[k * 3 + 2] = Math.sin(a) * s[2] * (1 - s[0] * 0.6);
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = 0.85 * holoOn;

      renderer.render(scene, camera);
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    }

    readScroll();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    io.observe(host);
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
      <div
        ref={wrap}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_40%,#2a1458_0%,#0b0620_62%,#07041a_100%)] shadow-lift"
      >
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
