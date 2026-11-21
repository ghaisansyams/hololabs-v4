"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type * as T from "three";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface StageStep {
  mood: string;
  title: string;
  description: string;
  minutes: string;
}

export interface StageHero {
  badge: string;
  title: string;
  titleAccent: string;
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  hud: { value: string; label: string }[];
}

type Visual = { kind: "ticket" } | { kind: "image"; src: string; crop?: [number, number, number, number] };

/**
 * One visual per chapter. `crop` is [x, y, w, h] as fractions of the photo,
 * measured from the top-left. Chapter 4 reuses the glowing figure from the
 * DJ photo, and the e-ticket is drawn on a canvas.
 */
const VISUALS: (Visual & { aspect: number; tint: number })[] = [
  { kind: "ticket", aspect: 1.25, tint: 0xa855f7 },
  { kind: "image", src: "/experience/journey-of-life.jpg", aspect: 1400 / 1253, tint: 0x3b82f6 },
  { kind: "image", src: "/experience/dj.jpg", aspect: 1400 / 1269, tint: 0xd946ef },
  { kind: "image", src: "/experience/dj.jpg", crop: [0.38, 0.04, 0.58, 0.62], aspect: (0.58 * 1400) / (0.62 * 1269), tint: 0x22d3ee },
  { kind: "image", src: "/experience/smarthome.jpg", aspect: 1400 / 1140, tint: 0xf59e0b },
  { kind: "image", src: "/experience/print3d.jpg", aspect: 1070 / 600, tint: 0xe9d5ff },
  { kind: "image", src: "/experience/logo-hd.jpg", aspect: 1600 / 1326, tint: 0xec4899 },
];

const STOPS = 8; // hero + 7 chapters
const SPACING = 11;
const FIRST_Z = -14;
const VIEW_DIST = 8.5;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/** 1 while the camera rests at a stop, fading to 0 as it travels away. */
const restOpacity = (distance: number) => clamp(1 - (distance - 0.12) / 0.2);

function stopZ(index: number) {
  return index === 0 ? 9 : FIRST_Z - (index - 1) * SPACING + VIEW_DIST;
}

/** Camera depth for a scroll position t in [0, STOPS-1], dwelling at each stop. */
function cameraZ(t: number) {
  const s = Math.min(STOPS - 2, Math.floor(t));
  const u = smooth(clamp((t - s - 0.18) / 0.64));
  return stopZ(s) + (stopZ(s + 1) - stopZ(s)) * u;
}

function drawTicket(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 800;
  c.height = 640;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 800, 640);
  bg.addColorStop(0, "#120b22");
  bg.addColorStop(1, "#2a1450");
  g.fillStyle = bg;
  g.fillRect(0, 0, 800, 640);
  g.strokeStyle = "rgba(192,132,252,0.6)";
  g.lineWidth = 4;
  g.strokeRect(20, 20, 760, 600);

  g.fillStyle = "#c084fc";
  g.font = "600 26px sans-serif";
  g.fillText("E-TICKET", 60, 90);
  g.fillStyle = "#ffffff";
  g.font = "800 64px sans-serif";
  g.fillText("HOLOLABS", 60, 165);

  // QR-like block (decorative, seeded so it never changes between loads)
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = 21;
  const cell = 11;
  const ox = 60;
  const oy = 230;
  g.fillStyle = "#ffffff";
  g.fillRect(ox - 12, oy - 12, n * cell + 24, n * cell + 24);
  g.fillStyle = "#0c0814";
  const finder = (fx: number, fy: number) => {
    g.fillRect(ox + fx * cell, oy + fy * cell, 7 * cell, 7 * cell);
    g.fillStyle = "#ffffff";
    g.fillRect(ox + (fx + 1) * cell, oy + (fy + 1) * cell, 5 * cell, 5 * cell);
    g.fillStyle = "#0c0814";
    g.fillRect(ox + (fx + 2) * cell, oy + (fy + 2) * cell, 3 * cell, 3 * cell);
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inFinder && rnd() > 0.5) g.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);

  g.fillStyle = "#a79ec0";
  g.font = "500 24px sans-serif";
  g.fillText("Kode booking", 380, 270);
  g.fillStyle = "#ffffff";
  g.font = "700 40px sans-serif";
  g.fillText("HL-2611-X7K2", 380, 320);
  g.fillStyle = "#a79ec0";
  g.font = "500 24px sans-serif";
  g.fillText("Tanggal", 380, 400);
  g.fillText("Show", 560, 400);
  g.fillStyle = "#ffffff";
  g.font = "700 34px sans-serif";
  g.fillText("13 Nov", 380, 442);
  g.fillText("18.00", 560, 442);
  g.fillStyle = "rgba(52,211,153,0.18)";
  g.beginPath();
  if (typeof g.roundRect === "function") g.roundRect(380, 500, 150, 54, 27);
  else g.rect(380, 500, 150, 54);
  g.fill();
  g.fillStyle = "#34d399";
  g.font = "700 26px sans-serif";
  g.fillText("VALID", 418, 537);
  return c;
}

function softDot(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.35, "rgba(255,255,255,0.45)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The homepage's centrepiece: a real WebGL scene (three.js). The page
 * scroll flies the camera through a tunnel of seven glowing panels, one
 * per chapter of the show, after a hero built around a glowing wireframe
 * "holo core". The 3D code is loaded after first paint; if WebGL is unavailable
 * or the visitor prefers reduced motion, a plain illustrated list of the
 * same chapters is shown instead.
 */
export function ExperienceStage({ hero, steps }: { hero: StageHero; steps: StageStep[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"stage" | "static">("stage");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0); // 0 = hero, 1..n = chapter
  const count = Math.min(steps.length, STOPS - 1);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !webglAvailable()) setMode("static");
  }, []);

  useEffect(() => {
    if (mode !== "stage") return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !canvas) return;

    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    (async () => {
      let THREE: typeof T;
      try {
        THREE = await import("three");
      } catch {
        if (!disposed) setMode("static");
        return;
      }
      if (disposed) return;

      let renderer: T.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      } catch {
        setMode("static");
        return;
      }
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
      renderer.setClearColor(0x050308, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050308, 0.017);
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 160);
      const disposables: { dispose: () => void }[] = [];
      const track = <D extends { dispose: () => void }>(d: D): D => {
        disposables.push(d);
        return d;
      };

      const dot = track(new THREE.CanvasTexture(softDot()));

      // ---- star field -------------------------------------------------
      const starCount = mobile ? 700 : 1500;
      const pos = new Float32Array(starCount * 3);
      const col = new Float32Array(starCount * 3);
      const palette = [new THREE.Color(0xc084fc), new THREE.Color(0x60a5fa), new THREE.Color(0xf0abfc), new THREE.Color(0xffffff)];
      for (let i = 0; i < starCount; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 60;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
        pos[i * 3 + 2] = 14 - Math.random() * 110;
        const c = palette[Math.floor(Math.random() * palette.length)];
        col.set([c.r, c.g, c.b], i * 3);
      }
      const starGeo = track(new THREE.BufferGeometry());
      starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      starGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const starMat = track(
        new THREE.PointsMaterial({
          size: 0.16,
          map: dot,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // ---- light runway along the floor --------------------------------
      const runwayCount = 220;
      const rp = new Float32Array(runwayCount * 3);
      for (let i = 0; i < runwayCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        rp[i * 3] = side * (2.2 + (i % 5) * 0.02);
        rp[i * 3 + 1] = -3.3;
        rp[i * 3 + 2] = 6 - (i / runwayCount) * 90;
      }
      const runwayGeo = track(new THREE.BufferGeometry());
      runwayGeo.setAttribute("position", new THREE.BufferAttribute(rp, 3));
      const runwayMat = track(
        new THREE.PointsMaterial({
          size: 0.22,
          map: dot,
          color: 0xc084fc,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      scene.add(new THREE.Points(runwayGeo, runwayMat));

      // ---- hero: holo core (wireframe lattice, rings, data net) --------
      const loader = new THREE.TextureLoader();
      let loaded = 0;
      const needed = 3;
      const markLoaded = () => {
        loaded += 1;
        if (loaded >= needed && !disposed) setReady(true);
      };
      const loadTexture = (src: string, crop?: [number, number, number, number]) => {
        const tex = track(loader.load(src, () => markLoaded(), undefined, () => markLoaded()));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        if (crop) {
          tex.repeat.set(crop[2], crop[3]);
          tex.offset.set(crop[0], 1 - crop[1] - crop[3]);
        }
        return tex;
      };

      const core = new THREE.Group();
      scene.add(core);
      const coreMats: { mat: { opacity: number }; base: number }[] = [];
      const glowMat = (color: number, base: number, wire = true) => {
        const mat = track(
          new THREE.MeshBasicMaterial({
            color,
            wireframe: wire,
            transparent: true,
            opacity: base,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
          }),
        );
        coreMats.push({ mat, base });
        return mat;
      };
      const inner = new THREE.Mesh(track(new THREE.IcosahedronGeometry(1.5, 1)), glowMat(0x22d3ee, 0.6));
      const outer = new THREE.Mesh(track(new THREE.IcosahedronGeometry(2.35, 2)), glowMat(0xa855f7, 0.26));
      core.add(inner, outer);

      const spriteMat = (color: number, base: number) => {
        const mat = track(
          new THREE.SpriteMaterial({ map: dot, color, transparent: true, opacity: base, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
        );
        coreMats.push({ mat, base });
        return mat;
      };
      const nucleus = new THREE.Sprite(spriteMat(0x7dd3fc, 0.95));
      nucleus.scale.set(3.6, 3.6, 1);
      const halo = new THREE.Sprite(spriteMat(0x7c3aed, 0.4));
      halo.scale.set(10, 10, 1);
      core.add(halo, nucleus);

      // three gyroscope rings, each carrying a few bright nodes
      const rings: T.Mesh[] = [];
      [
        { r: 2.95, color: 0x22d3ee, rx: 1.15, ry: 0 },
        { r: 3.45, color: 0x818cf8, rx: 0.35, ry: 0.9 },
        { r: 3.95, color: 0xe879f9, rx: 1.45, ry: -0.7 },
      ].forEach((cfg, i) => {
        const ring = new THREE.Mesh(track(new THREE.TorusGeometry(cfg.r, 0.014, 8, 180)), glowMat(cfg.color, 0.7, false));
        ring.rotation.set(cfg.rx, cfg.ry, 0);
        const nodePos = new Float32Array(9);
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + i;
          nodePos[k * 3] = Math.cos(a) * cfg.r;
          nodePos[k * 3 + 1] = Math.sin(a) * cfg.r;
        }
        const nodeGeo = track(new THREE.BufferGeometry());
        nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
        const nodeMat = track(
          new THREE.PointsMaterial({ size: 0.34, map: dot, color: cfg.color, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
        );
        coreMats.push({ mat: nodeMat, base: 1 });
        ring.add(new THREE.Points(nodeGeo, nodeMat));
        core.add(ring);
        rings.push(ring);
      });

      // data net: nodes scattered on a shell, linked when close
      const netCount = mobile ? 46 : 72;
      const netPts: T.Vector3[] = [];
      for (let i = 0; i < netCount; i++) {
        const y = 1 - (i / (netCount - 1)) * 2;
        const rad = Math.sqrt(1 - y * y);
        const theta = i * 2.399963;
        const shell = 4.5 + ((i * 37) % 10) / 12;
        netPts.push(new THREE.Vector3(Math.cos(theta) * rad * shell, y * shell, Math.sin(theta) * rad * shell));
      }
      const linePos: number[] = [];
      for (let i = 0; i < netPts.length; i++) {
        for (let j = i + 1; j < netPts.length; j++) {
          if (netPts[i].distanceTo(netPts[j]) < 2.5) linePos.push(netPts[i].x, netPts[i].y, netPts[i].z, netPts[j].x, netPts[j].y, netPts[j].z);
        }
      }
      const netGeo = track(new THREE.BufferGeometry());
      netGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
      const netLineMat = track(
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
      );
      coreMats.push({ mat: netLineMat, base: 0.22 });
      const netDotGeo = track(new THREE.BufferGeometry().setFromPoints(netPts));
      const netDotMat = track(
        new THREE.PointsMaterial({ size: 0.16, map: dot, color: 0xbae6fd, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
      );
      coreMats.push({ mat: netDotMat, base: 0.95 });
      const net = new THREE.Group();
      net.add(new THREE.LineSegments(netGeo, netLineMat), new THREE.Points(netDotGeo, netDotMat));
      core.add(net);

      // ---- chapter panels ---------------------------------------------
      const ticketTex = track(new THREE.CanvasTexture(drawTicket()));
      ticketTex.colorSpace = THREE.SRGBColorSpace;
      ticketTex.anisotropy = 4;
      markLoaded();

      const glowTexCache = track(new THREE.CanvasTexture(softDot()));
      type Panel = {
        group: T.Group;
        mat: T.MeshBasicMaterial;
        glow: T.MeshBasicMaterial;
        line: T.LineBasicMaterial;
        scan: T.MeshBasicMaterial;
        scanMesh: T.Mesh;
        w: number;
        h: number;
        side: number;
      };
      const panels: Panel[] = [];
      for (let i = 0; i < count; i++) {
        const v = VISUALS[i % VISUALS.length];
        const map = v.kind === "ticket" ? ticketTex : loadTexture(v.src, v.crop);
        const group = new THREE.Group();

        const mat = track(new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide }));
        const face = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), mat);
        group.add(face);

        const glow = track(
          new THREE.MeshBasicMaterial({
            map: glowTexCache,
            color: v.tint,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            fog: false,
          }),
        );
        const glowMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), glow);
        glowMesh.position.z = -0.08;
        glowMesh.userData.glow = true;
        group.add(glowMesh);

        const line = track(new THREE.LineBasicMaterial({ color: v.tint, transparent: true, opacity: 0.9 }));
        const L = 0.14;
        const corners: [number, number][] = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
        const br: number[] = [];
        for (const [cx, cy] of corners) {
          const sx = cx < 0 ? 1 : -1;
          const sy = cy < 0 ? 1 : -1;
          br.push(cx, cy, 0.01, cx + sx * L, cy, 0.01, cx, cy, 0.01, cx, cy + sy * L, 0.01);
        }
        const brGeo = track(new THREE.BufferGeometry());
        brGeo.setAttribute("position", new THREE.Float32BufferAttribute(br, 3));
        const outline = new THREE.LineSegments(brGeo, line);
        group.add(outline);

        const scan = track(
          new THREE.MeshBasicMaterial({ color: v.tint, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
        );
        const scanMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 0.012)), scan);
        scanMesh.position.z = 0.02;
        group.add(scanMesh);

        scene.add(group);
        panels.push({ group, mat, glow, line, scan, scanMesh, w: 1, h: 1, side: i % 2 === 0 ? -1 : 1 });
      }

      // ---- layout (depends on aspect ratio) ----------------------------
      let portrait = false;
      const layout = () => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        portrait = camera.aspect < 0.95;
        camera.fov = portrait ? 62 : 48;
        camera.updateProjectionMatrix();

        core.scale.setScalar(portrait ? 0.5 : 0.55);
        core.position.set(0, portrait ? 3.4 : 2.3, 0);

        panels.forEach((p, i) => {
          const v = VISUALS[i % VISUALS.length];
          const pw = portrait ? 3.8 : 4.4;
          const ph = pw / v.aspect;
          p.w = pw;
          p.h = ph;
          const face = p.group.children[0] as T.Mesh;
          face.scale.set(pw, ph, 1);
          (p.group.children[1] as T.Mesh).scale.set(pw * 1.55, ph * 1.7, 1);
          (p.group.children[2] as T.LineSegments).scale.set(pw, ph, 1);
          p.scanMesh.scale.set(pw, 1, 1);
        });
      };
      layout();

      // ---- input -------------------------------------------------------
      const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      const ro = new ResizeObserver(layout);
      ro.observe(stage);

      let visible = true;
      const io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
      });
      io.observe(section);

      // ---- loop --------------------------------------------------------
      let smoothT = 0;
      let last = performance.now();
      let lastActive = -1;
      const clock0 = last;

      const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        try {
          step(now);
        } catch (error) {
          console.error("[3d] scene error, memakai tampilan statis", error);
          cancelAnimationFrame(frame);
          setMode("static");
        }
      };
      const step = (now: number) => {
        if (!visible) {
          last = now;
          return;
        }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const time = (now - clock0) / 1000;

        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = clamp(-rect.top / Math.max(1, rect.height - vh));
        const targetT = p * (STOPS - 1);
        smoothT += (targetT - smoothT) * (1 - Math.exp(-dt * 5));

        ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
        ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));

        const camZ = cameraZ(smoothT);
        camera.position.set(ptr.x * 0.55, -ptr.y * 0.3, camZ);
        camera.lookAt(ptr.x * 0.15, -ptr.y * 0.08, camZ - 10);

        // hero core: fades as the camera dives into it
        const heroFade = clamp((camZ - 2.5) / 5);
        core.visible = heroFade > 0.01;
        for (const m of coreMats) m.mat.opacity = m.base * heroFade;
        const pulse = 1 + Math.sin(time * 1.6) * 0.04;
        nucleus.scale.setScalar(3.6 * pulse);
        inner.rotation.y = time * 0.25;
        inner.rotation.x = time * 0.12;
        outer.rotation.y = -time * 0.15;
        outer.rotation.z = time * 0.08;
        rings[0].rotation.z = time * 0.35;
        rings[1].rotation.z = -time * 0.28;
        rings[2].rotation.z = time * 0.2;
        net.rotation.y = time * 0.07;
        core.rotation.y = ptr.x * 0.35;
        core.rotation.x = ptr.y * 0.2;

        // panels
        for (let i = 0; i < panels.length; i++) {
          const pn = panels[i];
          const focus = FIRST_Z - i * SPACING;
          const act = clamp(1 - Math.abs(camZ - VIEW_DIST - focus) / 9);
          const dist = camZ - focus;
          const vis = clamp((20 - dist) / 8);
          const bright = (0.3 + 0.7 * act) * vis;
          pn.mat.color.setScalar(bright);
          pn.mat.opacity = (0.35 + 0.65 * act) * vis;
          pn.glow.opacity = (0.25 + 0.5 * act) * vis;
          pn.line.opacity = (0.35 + 0.65 * act) * vis;
          pn.scan.opacity = 0.9 * act * vis;
          pn.scanMesh.position.y = (((time * 0.35 + i * 0.3) % 1) - 0.5) * pn.h;
          const x = portrait ? 0 : pn.side * 3.0;
          const y = portrait ? 1.9 : 0.2;
          const lift = Math.sin(time * 0.6 + i) * 0.08;
          pn.group.position.set(x, y + lift, focus + act * 0.8);
          pn.group.rotation.y = portrait ? 0 : -pn.side * (0.24 - 0.1 * act);
          pn.group.scale.setScalar(0.94 + 0.08 * act);
          pn.group.visible = vis > 0.01 && dist > -2;
        }

        stars.position.z = Math.sin(time * 0.1) * 0.5;

        renderer.render(scene, camera);

        // drive the HTML overlay without re-rendering React every frame
        const rounded = Math.round(smoothT);
        const d = Math.abs(smoothT - rounded);
        stage.style.setProperty("--o", restOpacity(d).toFixed(3));
        stage.style.setProperty("--p", p.toFixed(4));
        stage.style.setProperty("--t", smoothT.toFixed(3));
        if (rounded !== lastActive) {
          lastActive = rounded;
          setActive(Math.min(rounded, count));
        }
      };
      frame = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onPointer);
        ro.disconnect();
        io.disconnect();
        for (const d of disposables) d.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, [mode, count]);

  function jump(index: number) {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const span = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / (STOPS - 1)) * span, behavior: "smooth" });
  }

  if (mode === "static") {
    return <StaticExperience hero={hero} steps={steps.slice(0, count)} />;
  }

  const stepIndex = Math.max(0, active - 1);
  const step = steps[stepIndex];
  const side = stepIndex % 2 === 0 ? "right" : "left";
  // minutes elapsed in the show when each chapter begins ("20 menit" -> 20)
  const starts = steps.slice(0, count).reduce<number[]>((acc, st, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (parseInt(steps[i - 1].minutes, 10) || 0));
    return acc;
  }, []);

  return (
    <div
      ref={sectionRef}
      id="journey"
      className="relative"
      style={{ height: `${100 + (STOPS - 1) * 90}dvh` }}
    >
      <div ref={stageRef} data-mode="stage" data-ready={ready} className="exp-stage sticky top-0 h-dvh overflow-hidden bg-canvas">
        <canvas
          ref={canvasRef}
          aria-hidden
          className={cn("absolute inset-0 size-full transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(5_3_8/0.8))]" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-canvas-deep/85 via-canvas-deep/50 to-transparent"
          style={{ opacity: active === 0 ? "var(--o, 1)" : 0 }}
        />

        {/* HUD frame */}
        <div aria-hidden className="pointer-events-none absolute inset-3 sm:inset-5">
          <span className="absolute left-0 top-0 size-5 border-l border-t border-cyan/50" />
          <span className="absolute right-0 top-0 size-5 border-r border-t border-cyan/50" />
          <span className="absolute bottom-0 left-0 size-5 border-b border-l border-cyan/50" />
          <span className="absolute bottom-0 right-0 size-5 border-b border-r border-cyan/50" />
        </div>

        {/* Hero copy */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-end px-5 pb-28 pt-28 text-center sm:px-10 sm:pb-32",
            active === 0 ? "pointer-events-auto" : "pointer-events-none",
          )}
          style={{ opacity: active === 0 ? "var(--o, 1)" : 0 }}
        >
          <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-cyan sm:text-xs">{hero.badge}</p>
          <h1 className="mt-4 max-w-4xl text-[2.25rem] font-bold leading-[1.04] text-ink sm:text-6xl lg:text-7xl">
            {hero.title} <span className="bg-gradient-to-r from-cyan via-[#818cf8] to-[#e879f9] bg-clip-text text-transparent">{hero.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-ink-soft sm:text-base sm:leading-8">{hero.lead}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pesan" className={buttonStyles({ size: "lg" })}>
              {hero.ctaPrimary}
            </Link>
            <button type="button" onClick={() => jump(1)} className={buttonStyles({ variant: "secondary", size: "lg" })}>
              {hero.ctaSecondary}
            </button>
          </div>
        </div>

        {/* Hero readouts */}
        <dl
          className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto hidden max-w-4xl grid-cols-4 gap-px px-10 font-mono sm:grid"
          style={{ opacity: active === 0 ? "var(--o, 1)" : 0 }}
        >
          {hero.hud.map((item, i) => (
            <div key={i} className="border-l border-cyan/30 pl-4 text-left">
              <dd className="text-sm font-medium text-ink">{item.value}</dd>
              <dt className="text-[0.625rem] uppercase tracking-[0.16em] text-muted">{item.label}</dt>
            </div>
          ))}
        </dl>

        {/* Chapter copy */}
        {active > 0 && step ? (
          <div
            key={active}
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-24 pt-24 sm:px-10",
              "bg-gradient-to-t from-canvas-deep via-canvas-deep/80 to-transparent lg:top-0 lg:flex lg:h-full lg:w-[42%] lg:items-center lg:bg-none lg:p-0",
              side === "right" ? "lg:left-auto lg:right-0 lg:pr-20" : "lg:left-0 lg:pl-20",
            )}
            style={{ opacity: "var(--o, 0)" }}
          >
            <div className="max-w-md">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-cyan">
                CH.{String(active).padStart(2, "0")} / {String(count).padStart(2, "0")}
                <span aria-hidden className="mx-2 text-muted">{"//"}</span>
                <span className="text-ink-soft">{step.mood}</span>
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">{step.title}</h2>
              <p className="mt-4 text-base leading-8 text-ink-soft">{step.description}</p>
              <p className="mt-5 inline-flex items-center gap-3 rounded-md border border-cyan/30 bg-cyan-soft/60 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cyan">
                <span>T+{String(starts[stepIndex] ?? 0).padStart(2, "0")}&apos;</span>
                {step.minutes ? (
                  <>
                    <span aria-hidden className="h-3 w-px bg-cyan/40" />
                    <span>{step.minutes}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        ) : null}

        {/* Chapter timeline */}
        <nav
          aria-label="Babak journey"
          className={cn(
            "absolute inset-x-0 bottom-5 mx-auto max-w-4xl px-6 transition-opacity duration-500 sm:bottom-7 sm:px-10",
            active === 0 ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <ol className="grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: "0.375rem" }}>
            {steps.slice(0, count).map((st, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => jump(i + 1)}
                  aria-label={`Babak ${i + 1}: ${st.title}`}
                  aria-current={i + 1 === active ? "true" : undefined}
                  className="group block w-full py-2 text-left"
                >
                  <span className="block h-[3px] overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full origin-left bg-gradient-to-r from-cyan to-[#a855f7]"
                      style={{ transform: `scaleX(clamp(0, calc(var(--t, 0) - ${i}), 1))` }}
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 block font-mono text-[0.625rem] uppercase tracking-[0.12em] transition-colors",
                      i + 1 === active ? "text-cyan" : "text-muted group-hover:text-ink-soft",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                    <span className="hidden lg:inline"> {st.mood}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

      </div>

      <ol className="sr-only">
        {steps.slice(0, count).map((st, i) => (
          <li key={i}>
            {st.mood}: {st.title}. {st.description} {st.minutes}
          </li>
        ))}
      </ol>
    </div>
  );
}

const STATIC_IMAGES: { src: string; position: string }[] = [
  { src: "/experience/logo-hd.jpg", position: "50% 50%" },
  { src: "/experience/journey-of-life.jpg", position: "50% 40%" },
  { src: "/experience/dj.jpg", position: "50% 40%" },
  { src: "/experience/dj.jpg", position: "75% 25%" },
  { src: "/experience/smarthome.jpg", position: "50% 40%" },
  { src: "/experience/print3d.jpg", position: "60% 50%" },
  { src: "/experience/logo-hd.jpg", position: "50% 50%" },
];

/** Fallback with no WebGL or motion: the same chapters as a plain illustrated list. */
function StaticExperience({ hero, steps }: { hero: StageHero; steps: StageStep[] }) {
  return (
    <div id="journey" data-mode="static">
      <section className="relative flex min-h-dvh items-center overflow-hidden px-5 py-28 sm:px-10 lg:px-16">
        <Image
          src="/experience/logo-hd.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="relative max-w-xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.26em] text-cyan">{hero.badge}</p>
          <h1 className="mt-5 text-[2.5rem] leading-[1.05] text-ink sm:text-6xl">
            {hero.title} <span className="bg-gradient-to-r from-cyan via-[#818cf8] to-[#e879f9] bg-clip-text text-transparent">{hero.titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-8 text-ink-soft">{hero.lead}</p>
          <Link href="/pesan" className={buttonStyles({ size: "lg", className: "mt-8" })}>
            {hero.ctaPrimary}
          </Link>
        </div>
      </section>
      <ol className="mx-auto max-w-5xl space-y-16 px-5 py-16 sm:px-10">
        {steps.map((s, i) => {
          const img = STATIC_IMAGES[i % STATIC_IMAGES.length];
          return (
            <li key={i} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-card border border-line", i % 2 === 1 && "md:order-2")}>
                <Image src={img.src} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" style={{ objectPosition: img.position }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">
                  <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> / {String(steps.length).padStart(2, "0")}
                  <span className="mx-3 uppercase tracking-[0.2em] text-brand-ink">{s.mood}</span>
                </p>
                <h2 className="mt-3 text-3xl text-ink sm:text-4xl">{s.title}</h2>
                <p className="mt-4 text-base leading-8 text-ink-soft">{s.description}</p>
                {s.minutes ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{s.minutes}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
