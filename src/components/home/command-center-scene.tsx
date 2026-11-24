"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Reservation illustration: an isometric cut-away of the HOLOLABS Command
 * Center (after the render in /public/showroom/40.jpg). A white room with a
 * wooden slat wall, a video wall of 8 TVs in two rows showing a neon city,
 * the "COMMAND CENTER" sign, a long wooden table with black office chairs and
 * two side desks. The section's scroll progress builds it: floor, walls, the
 * TVs mount one by one, the furniture slides in, then the screens switch on.
 * Pointer movement turns the model a little; rendering pauses off screen and
 * reduced motion shows the finished room.
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

/** Small seeded random, so the city looks the same on every visit. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** The picture on the video wall: a neon city at night over the water. */
function drawCity() {
  const W = 1024;
  const H = 300;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(7);
  const horizon = 165;

  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#1c1a6e");
  sky.addColorStop(0.55, "#3b4fe0");
  sky.addColorStop(1, "#a03cf5");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, horizon);
  const halo = g.createRadialGradient(W / 2, horizon, 10, W / 2, horizon, 380);
  halo.addColorStop(0, "rgba(236,72,153,0.75)");
  halo.addColorStop(1, "rgba(236,72,153,0)");
  g.fillStyle = halo;
  g.fillRect(0, 0, W, horizon);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.5})`;
    g.fillRect(r() * W, r() * horizon * 0.6, 1.5, 1.5);
  }

  // two layers of towers, the nearer one darker and taller
  for (const layer of [0, 1]) {
    let x = -10;
    while (x < W) {
      const w = 18 + r() * 34;
      const centre = 1 - Math.abs(x + w / 2 - W / 2) / (W / 2);
      const h = (layer ? 50 : 70) + r() * (layer ? 70 : 60) + centre * (layer ? 60 : 30);
      g.fillStyle = layer ? "#2a32a8" : "#4352d8";
      g.fillRect(x, horizon - h, w, h);
      for (let wy = horizon - h + 6; wy < horizon - 4; wy += 7) {
        for (let wx = x + 4; wx < x + w - 3; wx += 6) {
          if (r() < 0.35) {
            g.fillStyle = r() < 0.5 ? "rgba(103,232,249,0.85)" : "rgba(240,171,252,0.85)";
            g.fillRect(wx, wy, 2, 3);
          }
        }
      }
      x += w + (layer ? 4 : 10) * r();
    }
  }
  // the tall glowing tower in the middle
  const tower = g.createLinearGradient(0, 20, 0, horizon);
  tower.addColorStop(0, "#f0abfc");
  tower.addColorStop(1, "#7c3aed");
  g.fillStyle = tower;
  g.beginPath();
  g.moveTo(W / 2, 14);
  g.lineTo(W / 2 + 22, 60);
  g.lineTo(W / 2 + 26, horizon);
  g.lineTo(W / 2 - 26, horizon);
  g.lineTo(W / 2 - 22, 60);
  g.closePath();
  g.fill();

  // bridge on the left with a pink light trail
  g.strokeStyle = "#ec4899";
  g.lineWidth = 3;
  g.shadowColor = "#f472b6";
  g.shadowBlur = 12;
  g.beginPath();
  g.moveTo(0, 128);
  g.quadraticCurveTo(200, 120, 400, horizon - 6);
  g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = "rgba(30,27,75,0.9)";
  g.lineWidth = 2;
  for (let x = 30; x < 380; x += 38) {
    const y = 128 + ((x / 400) ** 2) * 31;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, horizon);
    g.stroke();
  }

  // water: a darker, squashed reflection with light streaks
  g.save();
  g.translate(0, horizon * 2);
  g.scale(1, -1);
  g.globalAlpha = 0.45;
  g.drawImage(c, 0, 0, W, horizon, 0, horizon - (H - horizon) * 0.25, W, horizon);
  g.restore();
  const water = g.createLinearGradient(0, horizon, 0, H);
  water.addColorStop(0, "rgba(13,11,58,0.15)");
  water.addColorStop(1, "rgba(13,11,58,0.85)");
  g.fillStyle = water;
  g.fillRect(0, horizon, W, H - horizon);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(236,72,153,0.5)" : "rgba(103,232,249,0.4)";
    g.fillRect(r() * W, horizon + 6 + r() * (H - horizon - 10), 20 + r() * 60, 1.5);
  }
  return c;
}

/** Vertical wooden slats with dark gaps, as on the back wall of the render. */
function drawSlats() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const r = rng(3);
  g.fillStyle = "#3a2414";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    const x = i * 32;
    const tone = 0.9 + r() * 0.18;
    const base = `rgb(${Math.round(196 * tone)},${Math.round(140 * tone)},${Math.round(88 * tone)})`;
    const slat = g.createLinearGradient(x, 0, x + 26, 0);
    slat.addColorStop(0, "rgba(0,0,0,0.18)");
    slat.addColorStop(0.3, "rgba(255,255,255,0.08)");
    slat.addColorStop(1, "rgba(0,0,0,0.12)");
    g.fillStyle = base;
    g.fillRect(x + 3, 0, 26, 512);
    g.fillStyle = slat;
    g.fillRect(x + 3, 0, 26, 512);
    for (let k = 0; k < 6; k++) {
      g.fillStyle = `rgba(90,55,25,${0.08 + r() * 0.1})`;
      g.fillRect(x + 4 + r() * 22, 0, 1, 512);
    }
  }
  return c;
}

/** Light floor tiles with thin grout lines. */
function drawTiles() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e9e8ee";
  g.fillRect(0, 0, 256, 256);
  const sheen = g.createLinearGradient(0, 0, 256, 256);
  sheen.addColorStop(0, "rgba(255,255,255,0.5)");
  sheen.addColorStop(1, "rgba(180,180,195,0.25)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(150,150,165,0.55)";
  g.lineWidth = 2;
  g.strokeRect(1, 1, 254, 254);
  return c;
}

function drawSign() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.font = "700 86px 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "6px";
  g.lineWidth = 10;
  g.strokeStyle = "rgba(60,20,20,0.8)";
  g.strokeText("COMMAND CENTER", 512, 84);
  g.fillStyle = "#ffffff";
  g.fillText("COMMAND CENTER", 512, 84);
  return c;
}

export function CommandCenterScene({ note }: { note?: string }) {
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
    const target = new THREE.Vector3(0, 1.0, 0);

    // lights: soft daylight from the front right, plus the glow of the screens
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6b6880, 1.5));
    const key = new THREE.DirectionalLight(0xfff4e6, 2.1);
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
    const screenLight = new THREE.PointLight(0x8b5cf6, 0, 6, 1.6);
    screenLight.position.set(0, 1.4, -1.3);
    scene.add(screenLight);

    const root = new THREE.Group();
    scene.add(root);

    // ---- room shell ---------------------------------------------------
    const RW = 6; // width along x
    const RD = 4.4; // depth along z
    const RH = 2.6; // wall height
    const backZ = -RD / 2;
    const leftX = -RW / 2;
    const white = std(0xeeedf3, { roughness: 0.92 });
    const woodTrim = std(0xb07a46, { roughness: 0.7 });

    const floorRig = new THREE.Group();
    const slab = box(RW + 0.12, 0.14, RD + 0.12, std(0x2a2540, { roughness: 0.5 }), 0, -0.07, 0);
    const tileTex = canvasTex(drawTiles());
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(RW / 0.6, RD / 0.6);
    const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(RW, RD)), std(0xffffff, { map: tileTex, roughness: 0.28 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.002;
    floor.receiveShadow = true;
    floorRig.add(slab, floor);
    root.add(floorRig);

    const wallRig = new THREE.Group();
    const backWall = box(RW + 0.12, RH, 0.12, white, 0, RH / 2, backZ - 0.06);
    const leftWall = box(0.12, RH, RD + 0.12, white, leftX - 0.06, RH / 2, 0);
    backWall.receiveShadow = leftWall.receiveShadow = true;
    // wooden slat panel across the middle of the back wall
    const SLAT_W = 4.1;
    const slatTex = canvasTex(drawSlats());
    slatTex.wrapS = THREE.RepeatWrapping;
    slatTex.repeat.set(SLAT_W / 0.85, 1);
    const slats = box(SLAT_W, RH, 0.06, std(0xffffff, { map: slatTex, roughness: 0.75 }), 0, RH / 2, backZ + 0.03);
    slats.receiveShadow = true;
    // wooden skirting on the white parts
    const skirtL = box(0.03, 0.12, RD, woodTrim, leftX + 0.015, 0.06, 0);
    const skirtB1 = box((RW - SLAT_W) / 2, 0.12, 0.03, woodTrim, leftX + (RW - SLAT_W) / 4, 0.06, backZ + 0.015);
    const skirtB2 = skirtB1.clone();
    skirtB2.position.x = -skirtB1.position.x;
    // small whiteboard and a dark glass door on the left wall
    const board = box(0.03, 0.55, 0.75, std(0xd7dae2, { roughness: 0.3, metalness: 0.2 }), leftX + 0.02, 1.45, -0.9);
    const doorFrame = box(0.05, 2.05, 1.0, std(0x16161c, { roughness: 0.4 }), leftX + 0.03, 1.025, 1.3);
    const doorGlass = box(0.02, 1.85, 0.8, std(0x3a3f55, { roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.85 }), leftX + 0.06, 1.0, 1.3);
    // CCTV dome high on the back wall
    const cam = new THREE.Mesh(track(new THREE.SphereGeometry(0.07, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)), std(0xf5f5f7, { roughness: 0.3 }));
    cam.rotation.x = Math.PI;
    cam.position.set(RW / 2 - 0.35, RH - 0.08, backZ + 0.12);
    wallRig.add(backWall, leftWall, slats, skirtL, skirtB1, skirtB2, board, doorFrame, doorGlass, cam);
    root.add(wallRig);

    // ---- video wall: 8 TVs in two rows of four -----------------------
    const city = drawCity();
    const TV_W = 0.84;
    const TV_H = 0.48;
    const GAP = 0.014;
    const wallY = 1.45;
    const bezelMat = std(0x0b0b10, { roughness: 0.35, metalness: 0.4 });
    const bezelGeo = track(new THREE.BoxGeometry(TV_W + 0.012, TV_H + 0.012, 0.05));
    const screenGeo = track(new THREE.PlaneGeometry(TV_W, TV_H));
    const off = new THREE.Color(0x050509);
    const on = new THREE.Color(0xffffff);
    const tvs = Array.from({ length: 8 }, (_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const tex = canvasTex(city);
      tex.repeat.set(0.25, 0.5);
      tex.offset.set(col * 0.25, row === 0 ? 0.5 : 0);
      const mat = track(new THREE.MeshBasicMaterial({ map: tex, color: off.clone(), toneMapped: false }));
      const tv = new THREE.Group();
      tv.position.set((col - 1.5) * (TV_W + GAP), wallY + (row === 0 ? 1 : -1) * (TV_H + GAP) * 0.5, backZ + 0.09);
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      const screen = new THREE.Mesh(screenGeo, mat);
      screen.position.z = 0.026;
      tv.add(bezel, screen);
      root.add(tv);
      // mount order runs across the wall; power-on order from the middle out
      const powerRank = [1, 0, 0, 1, 3, 2, 2, 3][i];
      return { tv, mat, mount: i * 0.025, power: powerRank * 0.035 + (row ? 0.015 : 0) };
    });
    const sign = new THREE.Mesh(
      track(new THREE.PlaneGeometry(1.7, 0.266)),
      track(new THREE.MeshBasicMaterial({ map: canvasTex(drawSign()), transparent: true, opacity: 0, toneMapped: false, depthWrite: false })),
    );
    sign.position.set(0, 2.24, backZ + 0.07);
    root.add(sign);

    // ---- furniture -----------------------------------------------------
    const tableWood = std(0xd8b27e, { roughness: 0.55 });
    const metal = std(0xc4c7cf, { roughness: 0.35, metalness: 0.7 });
    const black = std(0x15151a, { roughness: 0.75 });
    const blackHard = std(0x0d0d10, { roughness: 0.4, metalness: 0.3 });

    const table = new THREE.Group();
    table.add(
      box(3.4, 0.07, 1.05, tableWood, 0, 0.765, 0),
      box(0.1, 0.73, 0.8, tableWood, -1.35, 0.365, 0),
      box(0.1, 0.73, 0.8, tableWood, 1.35, 0.365, 0),
      box(2.6, 0.12, 0.06, tableWood, 0, 0.66, 0),
    );
    table.position.set(0.15, 0, -0.75);
    root.add(table);

    const desk = (withFlag: boolean) => {
      const g = new THREE.Group();
      g.add(box(1.15, 0.04, 0.55, tableWood, 0, 0.74, 0));
      for (const [lx, lz] of [
        [-0.5, -0.22],
        [0.5, -0.22],
        [-0.5, 0.22],
        [0.5, 0.22],
      ]) {
        const leg = new THREE.Mesh(track(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8)), metal);
        leg.position.set(lx, 0.36, lz);
        g.add(leg);
      }
      if (withFlag) {
        const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.006, 0.006, 0.32, 6)), metal);
        pole.position.set(0.3, 0.92, -0.1);
        const red = box(0.16, 0.05, 0.004, std(0xdc2626, { roughness: 0.8 }), 0.38, 1.04, -0.1);
        const wht = box(0.16, 0.05, 0.004, std(0xfafafa, { roughness: 0.8 }), 0.38, 0.99, -0.1);
        g.add(pole, red, wht);
      }
      return g;
    };
    const deskL = desk(false);
    deskL.position.set(-2.3, 0, backZ + 0.35);
    const deskR = desk(true);
    deskR.position.set(2.3, 0, backZ + 0.75);
    deskR.rotation.y = -0.12;
    root.add(deskL, deskR);

    const seatGeo = track(new RoundedBoxGeometry(0.5, 0.11, 0.48, 3, 0.04));
    const backGeo = track(new RoundedBoxGeometry(0.46, 0.6, 0.1, 3, 0.04));
    const armGeo = track(new RoundedBoxGeometry(0.06, 0.04, 0.32, 2, 0.015));
    const armPostGeo = track(new THREE.BoxGeometry(0.04, 0.16, 0.04));
    const postGeo = track(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 12));
    const spokeGeo = track(new THREE.BoxGeometry(0.3, 0.035, 0.05).translate(0.15, 0, 0));
    const casterGeo = track(new THREE.SphereGeometry(0.035, 10, 8));
    const officeChair = () => {
      const g = new THREE.Group();
      const seat = new THREE.Mesh(seatGeo, black);
      seat.position.y = 0.5;
      const back = new THREE.Mesh(backGeo, black);
      back.position.set(0, 0.88, 0.22);
      back.rotation.x = 0.12;
      g.add(seat, back);
      for (const sx of [-1, 1]) {
        const arm = new THREE.Mesh(armGeo, blackHard);
        arm.position.set(sx * 0.28, 0.68, 0.02);
        const post = new THREE.Mesh(armPostGeo, blackHard);
        post.position.set(sx * 0.28, 0.59, 0.06);
        g.add(arm, post);
      }
      const post = new THREE.Mesh(postGeo, blackHard);
      post.position.y = 0.28;
      g.add(post);
      for (let k = 0; k < 5; k++) {
        const spoke = new THREE.Mesh(spokeGeo, blackHard);
        spoke.position.y = 0.09;
        spoke.rotation.y = (k / 5) * Math.PI * 2;
        const caster = new THREE.Mesh(casterGeo, blackHard);
        const a = (k / 5) * Math.PI * 2;
        caster.position.set(Math.cos(a) * 0.3, 0.035, -Math.sin(a) * 0.3);
        g.add(spoke, caster);
      }
      return g;
    };
    // the chairs face the video wall; one sits at the left end of the table
    const chairSpots: [number, number, number][] = [
      [-1.95, -0.45, -0.9],
      [-0.75, 0.1, 0.12],
      [0.45, 0.05, -0.05],
      [1.55, 0.12, 0.18],
    ];
    const chairs = chairSpots.map(([x, z, ry], i) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0, z);
      pivot.rotation.y = ry;
      const c = officeChair();
      pivot.add(c);
      root.add(pivot);
      return { c, delay: i * 0.045 };
    });

    for (const o of [table, deskL, deskR, ...chairs.map((ch) => ch.c)]) {
      o.traverse((m) => {
        if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).castShadow = true;
      });
    }

    // sizing: an orthographic camera framing the whole room
    const VIEW = 7.6;
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
      // rAF timestamps can be a little older than the first performance.now()
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      if (!reduced) time += dt;
      prog += (goal - prog) * Math.min(1, reduced ? 1 : dt * 4);
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
      // the build finishes a little before the illustration is fully in view
      const p = clamp(prog / 0.85);

      // isometric-ish camera; the room turns so the video wall faces you as you scroll
      const el = 0.6 - pointer.y * 0.05;
      camera.position.set(Math.cos(el) * 14 * Math.SQRT1_2, Math.sin(el) * 14 + target.y, Math.cos(el) * 14 * Math.SQRT1_2);
      camera.lookAt(target);
      root.rotation.y = -0.15 + 0.6 * smooth(p / 0.9) + pointer.x * 0.16 + (reduced ? 0 : Math.sin(time * 0.2) * 0.04);
      root.scale.setScalar(0.88 + 0.12 * smooth(p / 0.35));

      // 1. floor, 2. walls rise
      const fl = Math.max(0.001, smooth(p / 0.16));
      floorRig.scale.set(fl, 1, fl);
      wallRig.scale.y = Math.max(0.001, smooth((p - 0.08) / 0.22));
      // 3. the TVs mount one by one
      for (const t of tvs) {
        const m = backOut((p - 0.26 - t.mount) / 0.14);
        t.tv.scale.setScalar(Math.max(0.001, Math.min(m, 1.06)));
      }
      // 4. table and desks rise, chairs roll in from the front
      const tb = backOut((p - 0.38) / 0.16);
      table.scale.set(1, Math.max(0.001, Math.min(tb, 1.05)), 1);
      const dk = backOut((p - 0.42) / 0.16);
      deskL.scale.setScalar(Math.max(0.001, Math.min(dk, 1.05)));
      deskR.scale.setScalar(Math.max(0.001, Math.min(dk, 1.05)));
      for (const ch of chairs) {
        const k = smooth((p - 0.48 - ch.delay) / 0.18);
        ch.c.position.z = (1 - k) * 1.8;
        ch.c.rotation.y = (1 - k) * 1.4;
        ch.c.scale.setScalar(Math.max(0.001, k));
      }
      // 5. the screens switch on with a short flicker, then the sign lights up
      let lit = 0;
      for (const t of tvs) {
        const k = clamp((p - 0.64 - t.power) / 0.06);
        const flicker = k > 0 && k < 1 ? (Math.sin(time * 60 + t.power * 40) > 0 ? 1 : 0.35) : 1;
        const pulse = reduced ? 1 : 0.94 + 0.06 * Math.sin(time * 1.3 + t.power * 9);
        t.mat.color.copy(off).lerp(on, k * flicker * pulse);
        lit += k / tvs.length;
      }
      const signOn = smooth((p - 0.84) / 0.1);
      (sign.material as THREE.MeshBasicMaterial).opacity = signOn;
      screenLight.intensity = 3 * lit;

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
            Command Center
          </div>
        ) : null}
      </div>
      {note ? <figcaption className="mt-4 text-center text-xs font-medium text-muted">{note}</figcaption> : null}
    </figure>
  );
}
