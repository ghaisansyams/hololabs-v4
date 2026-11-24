"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";

/**
 * The finale: a 3D-printed sneaker (lattice midsole, perforated upper, solid
 * outsole), with no hologram around it. As the panel scrolls into view the
 * shoe is printed bottom-up, layer by layer, under a moving nozzle, while it
 * turns to a three-quarter view; once printed it sways gently and follows the
 * pointer. Same scroll mechanics as the command room in the Reservasi block.
 */

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const smoothRange = (a: number, b: number, x: number) => smooth((x - a) / (b - a));

/* ---- sneaker geometry: length 1 along x (heel at -0.5), base at y = 0 ---- */
function footW(f: number, side: number) {
  let w = 0.165 + 0.04 * Math.exp(-(((f - 0.72) / 0.16) ** 2)) - 0.012 * Math.exp(-(((f - 0.08) / 0.1) ** 2));
  if (side < 0) w -= 0.035 * Math.exp(-(((f - 0.45) / 0.12) ** 2));
  return w;
}
const toeSpring = (f: number) => 0.07 * smoothRange(0.74, 1, f) ** 1.5;
const soleBottom = (f: number) => 0.04 + toeSpring(f) + 0.015 * smoothRange(0.12, 0, f);
const soleTop = (f: number) => 0.2 - 0.07 * f + toeSpring(f);
function outline(a: number): [number, number, number] {
  const f = (1 - Math.cos(a)) / 2;
  const sn = Math.sin(a);
  return [f - 0.5, sn * footW(f, sn >= 0 ? 1 : -1), f];
}

function gridGeometry(nu: number, nv: number, at: (u: number, v: number) => [number, number, number], keep?: (u: number, v: number) => boolean) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      pos.push(...at(i / nu, j / nv));
      uv.push(i / nu, j / nv);
    }
  }
  const row = nu + 1;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      if (keep && !keep((i + 0.5) / nu, (j + 0.5) / nv)) continue;
      const a = j * row + i;
      idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
function soleWall(lo: (f: number) => number, hi: (f: number) => number, bulge: number, levels: number) {
  return gridGeometry(160, levels, (u, v) => {
    const [x, z, f] = outline(u * Math.PI * 2);
    const b = 1 + bulge * Math.sin(Math.PI * v);
    return [x * (1 + bulge * 0.3 * Math.sin(Math.PI * v)), lo(f) + (hi(f) - lo(f)) * v, z * b];
  });
}
function soleCap(y: (f: number) => number, inset = 1) {
  return gridGeometry(8, 60, (u, v) => {
    const f = v;
    const r = Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));
    const z = (u < 0.5 ? footW(f, 1) * (1 - 2 * u) : -footW(f, -1) * (2 * u - 1)) * r * inset;
    return [f - 0.5, y(f), z];
  });
}
function merge(geos: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const uv: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  let base = 0;
  for (const g of geos) {
    pos.push(...(g.attributes.position.array as Float32Array));
    uv.push(...(g.attributes.uv.array as Float32Array));
    nor.push(...(g.attributes.normal.array as Float32Array));
    for (const i of g.index!.array as Uint32Array) idx.push(i + base);
    base += g.attributes.position.count;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return geo;
}
function shoeUpper() {
  return gridGeometry(
    48,
    96,
    (u, v) => {
      const f = v;
      const r = Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));
      const th = Math.PI * u;
      const hw = (u < 0.5 ? footW(f, 1) : footW(f, -1)) * Math.max(r, 0.02) * 0.97;
      let H = 0.12 + 0.2 * smoothRange(0.95, 0.4, f);
      if (f > 0.5) H *= 0.35 + 0.65 * Math.sqrt(r);
      return [f - 0.5, soleTop(f) - 0.01 + H * Math.sin(th) ** 0.75, Math.cos(th) * hw];
    },
    // ankle opening at the back of the top
    (u, v) => ((v - 0.17) / 0.21) ** 2 + ((u - 0.5) / 0.3) ** 2 > 1,
  );
}

const SHOE_TOP = 0.54; // highest point of the upper, in shoe units

const VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec2 vUv;
varying float vLy;
void main() {
  vUv = uv;
  vLy = position.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

/* Studio look: matcap shading, printed layer lines, voronoi lattice holes, a soft rim, and the hot edge where the nozzle lays the current layer. */
const FRAG = /* glsl */ `
uniform sampler2D uMatcap;
uniform vec3 uColor;
uniform float uCut;
uniform float uHot;
uniform float uLattice;
uniform float uStrut;
uniform vec2 uCells;
varying vec3 vN;
varying vec3 vV;
varying vec2 vUv;
varying float vLy;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453) * 0.8 + 0.1;
}
float cellEdge(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 c = n + g;
      c.x = mod(c.x, uCells.x);
      vec2 r = g + hash2(c) - f;
      float d = dot(r, r);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
    }
  }
  return sqrt(f2) - sqrt(f1);
}

void main() {
  if (vLy > uCut) discard;
  float edge = 0.0;
  if (uLattice > 0.5) {
    float e = cellEdge(vUv * uCells);
    if (e > uStrut) discard;
    edge = smoothstep(uStrut * 0.55, uStrut, e);
  }
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 col = texture2D(uMatcap, n.xy * 0.48 + 0.5).rgb * uColor;
  if (!gl_FrontFacing) col *= 0.45;
  col *= 0.9 + 0.1 * step(0.5, fract(vLy * 110.0));
  col *= 1.0 - edge * 0.2;
  float fr = pow(1.0 - abs(dot(n, normalize(vV))), 3.0);
  col += vec3(0.85, 0.82, 1.0) * fr * 0.2;
  col += vec3(1.0, 0.6, 0.25) * smoothstep(0.025, 0.0, uCut - vLy) * 1.3 * uHot;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

function studioMatcap() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1a22";
  g.fillRect(0, 0, 256, 256);
  const body = g.createRadialGradient(100, 90, 10, 128, 128, 128);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.35, "#d9d9e3");
  body.addColorStop(0.75, "#7d7d8c");
  body.addColorStop(1, "#2a2a36");
  g.fillStyle = body;
  g.beginPath();
  g.arc(128, 128, 128, 0, Math.PI * 2);
  g.fill();
  const spec = g.createRadialGradient(92, 78, 0, 92, 78, 34);
  spec.addColorStop(0, "rgba(255,255,255,0.95)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = spec;
  g.fillRect(0, 0, 256, 256);
  return c;
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(0,0,0,0.75)");
  r.addColorStop(0.55, "rgba(0,0,0,0.3)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return c;
}

export function ShoeScene({ fallback }: { fallback: string }) {
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
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "absolute inset-0 size-full";
    host.prepend(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const track = <D extends { dispose: () => void }>(d: D) => {
      disposables.push(d);
      return d;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    const target = new THREE.Vector3(0, 0.5, 0);

    const matcap = track(new THREE.CanvasTexture(studioMatcap()));
    matcap.colorSpace = THREE.SRGBColorSpace;
    const cut = { value: -0.01 };
    const hot = { value: 0 };
    const part = (geo: THREE.BufferGeometry, color: number, lattice?: { cells: [number, number]; strut: number }) =>
      new THREE.Mesh(
        track(geo),
        track(
          new THREE.ShaderMaterial({
            uniforms: {
              uMatcap: { value: matcap },
              uColor: { value: new THREE.Color(color) },
              uCut: cut,
              uHot: hot,
              uLattice: { value: lattice ? 1 : 0 },
              uStrut: { value: lattice?.strut ?? 0 },
              uCells: { value: new THREE.Vector2(...(lattice?.cells ?? [1, 1])) },
            },
            vertexShader: VERT,
            fragmentShader: FRAG,
            side: THREE.DoubleSide,
          }),
        ),
      );

    const shoe = new THREE.Group();
    shoe.add(
      part(merge([soleWall((f) => soleBottom(f) - 0.025, soleBottom, 0, 2), soleCap((f) => soleBottom(f) - 0.025), soleCap((f) => soleTop(f) - 0.012, 0.98)]), 0x475569),
      part(soleWall(soleBottom, soleTop, 0.05, 16), 0xf1f5f9, { cells: [44, 4], strut: 0.17 }),
      part(shoeUpper(), 0xa855f7, { cells: [12, 26], strut: 0.3 }),
    );
    const SCALE = 2.5;
    shoe.scale.setScalar(SCALE);
    const pivot = new THREE.Group();
    pivot.add(shoe);
    scene.add(pivot);

    // print nozzle: a small hot-end that sweeps over the layer being printed
    const nozzleMat = track(new THREE.MeshBasicMaterial({ color: 0xd4d4e0, transparent: true }));
    const nozzle = new THREE.Group();
    const cone = new THREE.Mesh(track(new THREE.ConeGeometry(0.06, 0.16, 20)), nozzleMat);
    cone.rotation.x = Math.PI;
    cone.position.y = 0.08;
    const block = new THREE.Mesh(track(new THREE.BoxGeometry(0.22, 0.14, 0.22)), nozzleMat);
    block.position.y = 0.23;
    const tipMat = track(new THREE.MeshBasicMaterial({ color: 0xffa64d, transparent: true }));
    const tip = new THREE.Mesh(track(new THREE.SphereGeometry(0.025, 12, 8)), tipMat);
    nozzle.add(cone, block, tip);
    scene.add(nozzle);

    // soft contact shadow on the floor
    const shadowTex = track(new THREE.CanvasTexture(shadowTexture()));
    const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 }));
    const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(SCALE * 1.25, SCALE * 0.62, 1);
    shadow.position.y = 0.005;
    scene.add(shadow);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep the whole shoe in frame on narrow panels
      camera.fov = w / h < 1.1 ? 36 : 30;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      if (reduced) requestAnimationFrame(frame);
    };

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
      const p = clamp(prog / 0.85);

      // camera: slightly above, easing a little closer as the print completes
      const dist = 5.9 - 0.5 * smooth(p);
      const el = 0.26 - pointer.y * 0.05;
      camera.position.set(0, target.y + Math.sin(el) * dist, Math.cos(el) * dist);
      camera.lookAt(target);

      // 1. the print rises layer by layer under the nozzle
      const pr = smoothRange(0.04, 0.8, p);
      cut.value = -0.01 + pr * (SHOE_TOP + 0.02);
      const printing = pr > 0.001 && pr < 0.999;
      hot.value = printing ? 1 : Math.max(0, hot.value - dt * 2);
      const sweep = reduced ? 0 : Math.sin(time * 5.2);
      const across = reduced ? 0 : Math.sin(time * 3.1 + 1);
      const nozzleOn = clamp(Math.min(pr * 12, (1 - pr) * 12));
      nozzle.position.set(sweep * SCALE * 0.42, cut.value * SCALE + 0.04, across * SCALE * 0.1);
      nozzle.visible = nozzleOn > 0.01;
      nozzleMat.opacity = nozzleOn;
      tipMat.opacity = nozzleOn;

      // 2. the shoe turns from side view to three-quarters, then sways
      const turn = -1.45 + 0.85 * smoothRange(0.1, 0.95, p);
      const sway = reduced ? 0 : Math.sin(time * 0.45) * 0.22 * smoothRange(0.85, 1, p);
      pivot.rotation.y = turn + sway + pointer.x * 0.25;
      pivot.scale.setScalar(0.9 + 0.1 * smoothRange(0, 0.4, p));
      shadowMat.opacity = 0.25 + 0.55 * smoothRange(0, 0.5, p);

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
    <div ref={wrap} className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#2a1458_0%,#0b0620_62%,#07041a_100%)]">
      {failed ? <Image src={fallback} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /> : null}
    </div>
  );
}
