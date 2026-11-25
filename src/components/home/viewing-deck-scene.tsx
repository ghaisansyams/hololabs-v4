"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Reservation illustration, the partner of CommandCenterScene: an isometric
 * cut-away of the second-floor audience seating (Kursi Penonton), after the
 * renders in /public/showroom/34-36.jpg. A wooden mezzanine deck with a black
 * mesh railing topped by a long wooden bar counter, black shell bar stools
 * and laptops, black steel roof beams with LED tubes and three hanging
 * projectors, and across the drop to the hall floor the long projection wall
 * showing the AI heart. The section's scroll progress builds it: deck and
 * hall floor, walls and beams, the railing and counter, the stools drop in,
 * the laptops open, the projectors lower, then the projection switches on and
 * the sign lights up. Pointer movement turns the model a little; rendering
 * pauses off screen and reduced motion shows the finished room.
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const backOut = (v: number) => {
  const t = clamp(v) - 1;
  return 1 + t * t * (2.4 * t + 1.4);
};

/** Small seeded random, so the pictures look the same on every visit. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** The projection: a glowing figure with a heart in its chest, orbit rings, lasers, a DJ and a crowd. */
function drawProjection() {
  const W = 1536;
  const H = 600;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(11);
  const cx = W / 2;

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1b1f6b");
  bg.addColorStop(0.55, "#3c3fb8");
  bg.addColorStop(1, "#24145a");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(cx, H * 0.45, 20, cx, H * 0.45, W * 0.45);
  glow.addColorStop(0, "rgba(129,140,248,0.5)");
  glow.addColorStop(1, "rgba(129,140,248,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) {
    g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.55})`;
    g.fillRect(r() * W, r() * H * 0.7, 2, 2);
  }

  // side panels of stage lights
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 120 : W - 300;
    g.fillStyle = "rgba(15,12,50,0.55)";
    g.fillRect(x0, 40, 180, H - 200);
    for (let k = 0; k < 7; k++) {
      g.fillStyle = k % 2 ? "rgba(244,114,182,0.9)" : "rgba(103,232,249,0.9)";
      g.fillRect(x0 + 30 + (k % 2) * 90, 70 + k * 50, 34, 12);
    }
  }

  // lasers fanning out from the stage
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.6;
    g.strokeStyle = r() < 0.5 ? "rgba(103,232,249,0.22)" : "rgba(232,121,249,0.22)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx + (r() - 0.5) * 120, H - 150);
    g.lineTo(cx + Math.cos(a) * 1200, H - 150 + Math.sin(a) * 1200);
    g.stroke();
  }

  // the figure: head and shoulders in pale blue light
  const body = g.createLinearGradient(0, 40, 0, H - 140);
  body.addColorStop(0, "rgba(147,197,253,0.55)");
  body.addColorStop(1, "rgba(79,70,229,0.08)");
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(cx, 105, 46, 58, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(cx - 34, 150);
  g.quadraticCurveTo(cx - 190, 175, cx - 230, 300);
  g.lineTo(cx - 150, H - 150);
  g.lineTo(cx + 150, H - 150);
  g.lineTo(cx + 230, 300);
  g.quadraticCurveTo(cx + 190, 175, cx + 34, 150);
  g.closePath();
  g.fill();
  // cables flowing from the shoulders
  g.lineWidth = 5;
  for (let k = 0; k < 8; k++) {
    const s = k < 4 ? -1 : 1;
    g.strokeStyle = `rgba(147,197,253,${0.25 + r() * 0.3})`;
    g.beginPath();
    g.moveTo(cx + s * 180, 230 + (k % 4) * 18);
    g.bezierCurveTo(cx + s * 320, 120 + r() * 80, cx + s * 420, 360 + r() * 60, cx + s * (520 + r() * 120), 200 + r() * 200);
    g.stroke();
  }

  // orbit rings around the chest
  g.lineWidth = 7;
  for (const [rx, ry, rot, col] of [
    [430, 70, -0.18, "rgba(253,224,171,0.55)"],
    [520, 92, -0.12, "rgba(244,114,182,0.4)"],
    [360, 52, -0.22, "rgba(165,243,252,0.45)"],
  ] as const) {
    g.strokeStyle = col;
    g.beginPath();
    g.ellipse(cx, 300, rx, ry, rot, 0, Math.PI * 2);
    g.stroke();
  }

  // the heart
  const hx = cx;
  const hy = 275;
  const heartGlow = g.createRadialGradient(hx, hy, 6, hx, hy, 150);
  heartGlow.addColorStop(0, "rgba(244,63,94,0.7)");
  heartGlow.addColorStop(1, "rgba(244,63,94,0)");
  g.fillStyle = heartGlow;
  g.fillRect(hx - 160, hy - 160, 320, 320);
  g.globalCompositeOperation = "source-over";
  g.shadowColor = "#fb7185";
  g.shadowBlur = 30;
  g.fillStyle = "#e11d48";
  g.beginPath();
  g.moveTo(hx, hy + 52);
  g.bezierCurveTo(hx - 80, hy, hx - 58, hy - 58, hx, hy - 26);
  g.bezierCurveTo(hx + 58, hy - 58, hx + 80, hy, hx, hy + 52);
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = "rgba(255,228,230,0.85)";
  g.lineWidth = 4;
  g.stroke();

  // the DJ booth and the crowd with hands up
  g.fillStyle = "#0b0a25";
  g.fillRect(cx - 110, H - 170, 220, 50);
  g.strokeStyle = "rgba(103,232,249,0.9)";
  g.lineWidth = 3;
  g.strokeRect(cx - 110, H - 170, 220, 50);
  g.beginPath();
  g.ellipse(cx, H - 196, 16, 20, 0, 0, Math.PI * 2);
  g.fill();
  g.fillRect(cx - 24, H - 180, 48, 20);
  g.fillStyle = "#0a0820";
  for (let x = -20; x < W + 20; x += 14 + r() * 10) {
    const hgt = 70 + r() * 60;
    g.beginPath();
    g.ellipse(x, H - hgt + 30, 11, 13, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x - 13, H - hgt + 40, 26, hgt);
    if (r() < 0.35) g.fillRect(x + (r() < 0.5 ? -14 : 10), H - hgt - 30, 4, 50);
  }
  for (let i = 0; i < 60; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(103,232,249,0.8)" : "rgba(244,114,182,0.8)";
    g.fillRect(r() * W, H - 40 - r() * 90, 3, 3);
  }
  return c;
}

/** Oak floor planks, as on the mezzanine deck. */
function drawPlanks() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const r = rng(5);
  for (let row = 0; row < 8; row++) {
    let x = -r() * 200;
    while (x < 512) {
      const w = 180 + r() * 160;
      const tone = 0.86 + r() * 0.2;
      g.fillStyle = `rgb(${Math.round(176 * tone)},${Math.round(124 * tone)},${Math.round(74 * tone)})`;
      g.fillRect(x, row * 64, w, 64);
      for (let k = 0; k < 5; k++) {
        g.fillStyle = `rgba(95,60,28,${0.06 + r() * 0.08})`;
        g.fillRect(x, row * 64 + 6 + r() * 52, w, 1.5);
      }
      g.fillStyle = "rgba(60,36,16,0.55)";
      g.fillRect(x, row * 64, 2, 64);
      x += w;
    }
    g.fillStyle = "rgba(60,36,16,0.5)";
    g.fillRect(0, row * 64, 512, 2);
  }
  return c;
}

/** Black wire mesh of the railing: a transparent canvas with a square grid. */
function drawMesh() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.strokeStyle = "#111114";
  g.lineWidth = 10;
  g.strokeRect(5, 5, 118, 118);
  return c;
}

/** A dark code editor, shown on the laptop screens. */
function drawCode() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 170;
  const g = c.getContext("2d")!;
  const r = rng(2);
  g.fillStyle = "#151a2e";
  g.fillRect(0, 0, 256, 170);
  g.fillStyle = "#232a45";
  g.fillRect(0, 0, 256, 14);
  for (let y = 24; y < 165; y += 10) {
    let x = 12 + Math.floor(r() * 3) * 12;
    while (x < 230 && r() < 0.8) {
      const w = 14 + r() * 40;
      g.fillStyle = ["#67e8f9", "#c4b5fd", "#f9a8d4", "#a5b4fc", "#e2e8f0"][Math.floor(r() * 5)];
      g.fillRect(x, y, w, 4);
      x += w + 6;
    }
  }
  return c;
}

function drawSign(text: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.font = "700 80px 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "6px";
  g.shadowColor = "rgba(103,232,249,0.9)";
  g.shadowBlur = 18;
  g.fillStyle = "#ffffff";
  // long signs are squeezed to fit the board
  g.fillText(text, 512, 84, 940);
  return c;
}

export function ViewingDeckScene({
  note,
  sign: signText = "KURSI PENONTON",
  fallback = "/showroom/36.jpg",
  className,
}: {
  note?: string;
  sign?: string;
  /** Photo shown when WebGL is not available. */
  fallback?: string;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
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
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "absolute inset-0 size-full";
    host.prepend(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const track = <D extends { dispose: () => void }>(d: D) => {
      disposables.push(d);
      return d;
    };
    const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
      track(new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...extra }));
    const canvasTex = (c: HTMLCanvasElement) => {
      const t = track(new THREE.CanvasTexture(c));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };
    const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat);
      m.position.set(x, y, z);
      return m;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const target = new THREE.Vector3(0, 0.45, 0);

    // lights: soft light from the front right, plus the blue glow of the projection
    scene.add(new THREE.HemisphereLight(0xffffff, 0x5d5a78, 1.35));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.9);
    key.position.set(5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const screenLight = new THREE.PointLight(0x6d7bff, 0, 7, 1.4);
    screenLight.position.set(0, 0.8, -1.2);
    scene.add(screenLight);

    const root = new THREE.Group();
    scene.add(root);

    // ---- shell: hall floor below, the mezzanine deck, walls ---------------
    const RW = 6; // width along x
    const RD = 4.4; // depth along z
    const TOP = 2.35; // roof beams
    const HALL = -0.95; // hall floor, below the deck
    const backZ = -RD / 2;
    const leftX = -RW / 2;
    const EDGE = -0.35; // front edge of the deck, where the railing stands
    const white = std(0xeeedf3, { roughness: 0.92 });
    const steel = std(0x18181d, { roughness: 0.5, metalness: 0.55 });

    const floorRig = new THREE.Group();
    // hall floor in the drop between the railing and the projection wall
    const hallFloor = box(RW, 0.1, EDGE - backZ, std(0x55576a, { roughness: 0.35 }), 0, HALL - 0.05, (EDGE + backZ) / 2);
    hallFloor.receiveShadow = true;
    // the deck: a solid block cut away at the front, oak planks on top
    const deckD = RD / 2 - EDGE;
    const deckBlock = box(RW, -HALL, deckD, std(0x2a2540, { roughness: 0.6 }), 0, HALL / 2 - 0.001, EDGE + deckD / 2);
    const plankTex = canvasTex(drawPlanks());
    plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping;
    plankTex.repeat.set(RW / 2.4, deckD / 2.4);
    const deck = new THREE.Mesh(track(new THREE.PlaneGeometry(RW, deckD)), std(0xffffff, { map: plankTex, roughness: 0.5 }));
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(0, 0.002, EDGE + deckD / 2);
    deck.receiveShadow = true;
    floorRig.add(hallFloor, deckBlock, deck);
    root.add(floorRig);

    const wallRig = new THREE.Group();
    const wallH = TOP - HALL;
    const backWall = box(RW + 0.12, wallH, 0.12, white, 0, HALL + wallH / 2, backZ - 0.06);
    const leftWall = box(0.12, wallH, RD + 0.12, white, leftX - 0.06, HALL + wallH / 2, 0);
    backWall.receiveShadow = leftWall.receiveShadow = true;
    // black steel frame: beams along the top, rafters across, LED tubes under them
    const beams = new THREE.Group();
    beams.add(
      box(RW + 0.12, 0.12, 0.12, steel, 0, TOP + 0.06, backZ),
      box(0.12, 0.12, RD + 0.12, steel, leftX, TOP + 0.06, 0),
      box(RW, 0.1, 0.1, steel, 0, TOP + 0.05, 0.35),
    );
    // LED tubes along the beam the projectors hang from
    const tubeMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    for (const x of [-0.92, 0.92]) beams.add(box(1.1, 0.03, 0.03, tubeMat, x, TOP - 0.02, 0.35));
    // a truss on the left wall
    for (let k = 0; k < 4; k++) {
      const z = -1.65 + k * 1.1;
      const bar = box(0.04, 0.06, 1.2, steel, leftX + 0.03, TOP - 0.35, z + 0.55);
      bar.rotation.x = k % 2 ? 0.5 : -0.5;
      beams.add(bar);
    }
    wallRig.add(backWall, leftWall, beams);
    root.add(wallRig);

    // ---- the projection wall ----------------------------------------------
    const SCR_W = 5.5;
    const SCR_H = 2.05;
    const SCR_Y = 0.78;
    const projTex = canvasTex(drawProjection());
    const screenMat = track(new THREE.MeshBasicMaterial({ map: projTex, color: 0x24242e, toneMapped: false }));
    const screen = new THREE.Mesh(track(new THREE.PlaneGeometry(SCR_W, SCR_H)), screenMat);
    screen.position.set(0, SCR_Y, backZ + 0.005);
    root.add(screen);
    const offColor = new THREE.Color(0x24242e);
    const onColor = new THREE.Color(0xdcdcf0);

    // ---- railing and bar counter -------------------------------------------
    const railing = new THREE.Group();
    const RAIL_H = 1.0;
    const meshTex = canvasTex(drawMesh());
    meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping;
    meshTex.repeat.set(RW / 0.25, RAIL_H / 0.25);
    const meshPanel = new THREE.Mesh(
      track(new THREE.PlaneGeometry(RW, RAIL_H)),
      std(0xffffff, { map: meshTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 }),
    );
    meshPanel.position.set(0, RAIL_H / 2, EDGE);
    railing.add(meshPanel, box(RW, 0.04, 0.04, steel, 0, 0.02, EDGE));
    const posts: THREE.Mesh[] = [];
    for (let k = 0; k <= 6; k++) {
      const post = box(0.05, RAIL_H, 0.05, steel, leftX + k * 1.0 - (k === 6 ? 0.025 : k === 0 ? -0.025 : 0), RAIL_H / 2, EDGE);
      post.castShadow = true;
      posts.push(post);
      railing.add(post);
    }
    root.add(railing);
    const counterWood = std(0x8a5a32, { roughness: 0.55 });
    const counter = box(RW, 0.06, 0.4, counterWood, 0, RAIL_H + 0.03, EDGE + 0.12);
    counter.castShadow = counter.receiveShadow = true;
    root.add(counter);

    // ---- bar stools: black shells on thin black legs, facing the projection
    const shellSeat = track(new RoundedBoxGeometry(0.44, 0.07, 0.4, 3, 0.03));
    const shellBack = track(new RoundedBoxGeometry(0.44, 0.32, 0.06, 3, 0.028));
    const legGeo = track(new THREE.CylinderGeometry(0.012, 0.012, 0.78, 6));
    const ringGeo = track(new THREE.TorusGeometry(0.19, 0.009, 6, 24));
    const shell = std(0x1f1f24, { roughness: 0.65 });
    const stool = () => {
      const g = new THREE.Group();
      const seat = new THREE.Mesh(shellSeat, shell);
      seat.position.y = 0.8;
      const back = new THREE.Mesh(shellBack, shell);
      back.position.set(0, 0.98, 0.19);
      back.rotation.x = -0.18;
      g.add(seat, back);
      for (const [lx, lz] of [
        [-0.17, -0.15],
        [0.17, -0.15],
        [-0.17, 0.15],
        [0.17, 0.15],
      ]) {
        const leg = new THREE.Mesh(legGeo, steel);
        leg.position.set(lx * 1.08, 0.39, lz * 1.08);
        leg.rotation.set(lz * 0.25, 0, -lx * 0.25);
        g.add(leg);
      }
      const ring = new THREE.Mesh(ringGeo, steel);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.3;
      g.add(ring);
      g.traverse((m) => {
        if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).castShadow = true;
      });
      return g;
    };
    const stoolX = [-2.45, -1.5, -0.55, 0.4, 1.35, 2.3];
    const stools = stoolX.map((x, i) => {
      const s = stool();
      s.position.set(x, 0, EDGE + 0.62);
      s.rotation.y = (i % 2 ? 0.08 : -0.06);
      root.add(s);
      return { s, delay: i * 0.03, baseY: 0 };
    });

    // ---- laptops on the counter, a coffee cup --------------------------------
    const code = drawCode();
    const laptopBase = track(new THREE.BoxGeometry(0.34, 0.014, 0.23));
    const lidGeo = track(new THREE.BoxGeometry(0.34, 0.22, 0.01).translate(0, 0.11, 0));
    const lidScreen = track(new THREE.PlaneGeometry(0.31, 0.19).translate(0, 0.11, 0.006));
    const alu = std(0xb9bcc6, { roughness: 0.35, metalness: 0.7 });
    const laptops = [-2.45, -0.55, 1.35].map((x, i) => {
      const g = new THREE.Group();
      g.position.set(x + 0.02, RAIL_H + 0.067, EDGE + 0.14);
      g.rotation.y = i === 1 ? 0.12 : -0.05;
      const base = new THREE.Mesh(laptopBase, alu);
      base.castShadow = true;
      const hinge = new THREE.Group();
      hinge.position.set(0, 0.007, -0.11);
      const lid = new THREE.Mesh(lidGeo, alu);
      const scrMat = track(new THREE.MeshBasicMaterial({ map: canvasTex(code), color: 0x000000, toneMapped: false }));
      const scr = new THREE.Mesh(lidScreen, scrMat);
      hinge.add(lid, scr);
      g.add(base, hinge);
      root.add(g);
      return { g, hinge, scrMat, delay: i * 0.03 };
    });
    const cup = new THREE.Group();
    const cupBody = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.032, 0.11, 16)), std(0xa47148, { roughness: 0.8 }));
    const lid = new THREE.Mesh(track(new THREE.CylinderGeometry(0.043, 0.043, 0.02, 16)), std(0xf5f5f5, { roughness: 0.5 }));
    lid.position.y = 0.065;
    cup.add(cupBody, lid);
    cup.position.set(0.55, RAIL_H + 0.115, EDGE + 0.16);
    root.add(cup);

    // ---- projectors hanging from the beam, with their light beams ------------
    const projBody = track(new RoundedBoxGeometry(0.44, 0.17, 0.36, 2, 0.03));
    const lensGeo = track(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16));
    const rodGeo = track(new THREE.CylinderGeometry(0.012, 0.012, 1, 6));
    const beamGeo = track(new THREE.ConeGeometry(1, 1, 4, 1, true));
    beamGeo.rotateY(Math.PI / 4);
    beamGeo.translate(0, -0.5, 0);
    beamGeo.rotateX(-Math.PI / 2); // tip at the origin, opening along +z
    const PROJ_Y = 1.75;
    const projectors = [-1.85, 0, 1.85].map((x, i) => {
      const g = new THREE.Group();
      g.position.set(x, PROJ_Y, 0.35);
      const body = new THREE.Mesh(projBody, std(0x101014, { roughness: 0.45, metalness: 0.3 }));
      body.castShadow = true;
      const lens = new THREE.Mesh(lensGeo, std(0x3a3f55, { roughness: 0.1, metalness: 0.8 }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0.1, -0.01, -0.19);
      const rod = new THREE.Mesh(rodGeo, steel);
      rod.scale.y = TOP - PROJ_Y - 0.1;
      rod.position.y = (TOP - PROJ_Y) / 2 + 0.04;
      g.add(body, lens, rod);
      root.add(g);
      // the beam: from the lens to this projector's third of the wall
      const beamMat = track(
        new THREE.MeshBasicMaterial({ color: 0x9fb2ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
      );
      const beam = new THREE.Mesh(beamGeo, beamMat);
      const from = new THREE.Vector3(x + 0.1, PROJ_Y - 0.01, 0.35 - 0.21);
      const to = new THREE.Vector3((i - 1) * (SCR_W / 3), SCR_Y, backZ + 0.01);
      beam.position.copy(from);
      beam.lookAt(to);
      const halfW = SCR_W / 6;
      const halfH = SCR_H / 2;
      beam.scale.set(halfW / Math.SQRT1_2, halfH / Math.SQRT1_2, from.distanceTo(to));
      root.add(beam);
      return { g, beamMat, delay: i * 0.025 };
    });

    const sign = new THREE.Mesh(
      track(new THREE.PlaneGeometry(1.9, 0.297)),
      track(new THREE.MeshBasicMaterial({ map: canvasTex(drawSign(signText.toUpperCase())), transparent: true, opacity: 0, toneMapped: false, depthWrite: false })),
    );
    // on a black steel board above the projection, like the sign over the command room's TVs
    const signY = (SCR_Y + SCR_H / 2 + TOP) / 2;
    const signBoard = box(2.3, 0.36, 0.04, steel, 0, signY, backZ + 0.02);
    sign.position.set(0, signY, backZ + 0.045);
    wallRig.add(signBoard);
    root.add(sign);

    // sizing: an orthographic camera framing the whole room
    const VIEW = 7.7;
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
      // setSize clears the canvas: draw again right away, even while the loop is paused
      renderer.render(scene, camera);
      if (reduced) requestAnimationFrame(frame);
    };

    // scroll progress of the illustration through the viewport, eased
    let goal = reduced ? 1 : 0;
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

    let last = performance.now();
    let time = 0;
    function frame(now: number) {
      raf = 0;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      if (!reduced) time += dt;
      prog += (goal - prog) * Math.min(1, reduced ? 1 : dt * 4);
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
      // the build finishes a little before the illustration is fully in view
      const p = clamp(prog / 0.85);

      // the same camera as the command room; the deck turns towards the projection as you scroll
      const el = 0.6 - pointer.y * 0.05;
      camera.position.set(Math.cos(el) * 14 * Math.SQRT1_2, Math.sin(el) * 14 + target.y, Math.cos(el) * 14 * Math.SQRT1_2);
      camera.lookAt(target);
      root.rotation.y = -0.1 + 0.68 * smooth(p / 0.9) + pointer.x * 0.16 + (reduced ? 0 : Math.sin(time * 0.2 + 1.3) * 0.04);
      root.scale.setScalar(0.88 + 0.12 * smooth(p / 0.35));

      // 1. deck and hall floor, 2. walls and beams rise
      const fl = Math.max(0.001, smooth(p / 0.16));
      floorRig.scale.set(fl, 1, fl);
      wallRig.scale.y = Math.max(0.001, smooth((p - 0.08) / 0.22));
      screen.scale.y = Math.max(0.001, smooth((p - 0.18) / 0.14));
      // 3. railing posts pop up, the mesh fills in, the counter drops on top
      posts.forEach((post, k) => {
        post.scale.y = Math.max(0.001, Math.min(backOut((p - 0.26 - k * 0.012) / 0.12), 1.06));
      });
      meshPanel.scale.y = Math.max(0.001, smooth((p - 0.32) / 0.1));
      meshPanel.position.y = (RAIL_H / 2) * meshPanel.scale.y;
      const ct = smooth((p - 0.36) / 0.1);
      counter.position.y = RAIL_H + 0.03 + (1 - ct) * 0.8;
      counter.scale.x = Math.max(0.001, ct);
      // 4. the stools drop in, one by one
      for (const st of stools) {
        const k = backOut((p - 0.44 - st.delay) / 0.14);
        st.s.position.y = (1 - Math.min(k, 1)) * 1.4;
        st.s.scale.setScalar(Math.max(0.001, Math.min(k, 1.05)));
      }
      // 5. laptops appear and open
      for (const lp of laptops) {
        const k = smooth((p - 0.58 - lp.delay) / 0.1);
        lp.g.scale.setScalar(Math.max(0.001, Math.min(1, k * 1.6)));
        lp.hinge.rotation.x = -(Math.PI / 2) * (1 - k) - 0.22 * k;
        lp.scrMat.color.setScalar(smooth((p - 0.66 - lp.delay) / 0.06));
      }
      cup.scale.setScalar(Math.max(0.001, backOut((p - 0.62) / 0.1)));
      // 6. projectors lower from the beam
      for (const pr of projectors) {
        const k = smooth((p - 0.62 - pr.delay) / 0.1);
        pr.g.position.y = PROJ_Y + (1 - k) * 0.6;
        pr.g.scale.setScalar(Math.max(0.001, k));
      }
      // 7. the projectors switch on with a short flicker, the picture fades up
      let lit = 0;
      for (const pr of projectors) {
        const k = clamp((p - 0.72 - pr.delay) / 0.06);
        const flicker = k > 0 && k < 1 ? (Math.sin(time * 60 + pr.delay * 300) > 0 ? 1 : 0.3) : 1;
        pr.beamMat.opacity = 0.12 * k * flicker * (reduced ? 1 : 0.85 + 0.15 * Math.sin(time * 1.7 + pr.delay * 90));
        lit += (k * flicker) / projectors.length;
      }
      const pulse = reduced ? 1 : 0.95 + 0.05 * Math.sin(time * 1.3);
      screenMat.color.copy(offColor).lerp(onColor, lit * pulse);
      screenLight.intensity = 3.2 * lit;
      // 8. the sign lights up
      (sign.material as THREE.MeshBasicMaterial).opacity = smooth((p - 0.86) / 0.1);

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
  }, [signText]);

  return (
    <figure className={className ? `w-full ${className}` : "mx-auto w-full max-w-md"}>
      <div
        ref={wrap}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_40%,#2a1458_0%,#0b0620_62%,#07041a_100%)] shadow-lift"
      >
        {failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallback} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
        ) : null}
      </div>
      {note ? <figcaption className="mt-4 text-center text-xs font-medium text-muted">{note}</figcaption> : null}
    </figure>
  );
}
