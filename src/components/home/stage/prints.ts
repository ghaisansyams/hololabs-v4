import * as THREE from "three";
import type { Ctx } from "./chapters";

/**
 * Showcase of typical 3D-printed objects (lattice vase, voronoi torso, twisted
 * vase, rocket, knot, perforated star, lattice ball), shared by the printing
 * chapter (ch.6, revealed bottom-up by `cut`) and the keepsake chapter (ch.7).
 *
 * Every object uses one shader: a neutral matcap tinted per object, printed
 * layer lines, a holographic rim and scan band, and an optional voronoi
 * lattice that cuts real holes (back faces stay lit darker, so the openings
 * read clearly). Each geometry sits with its base at y = 0.
 */
export type PrintKind = "latticeVase" | "torso" | "twistVase" | "rocket" | "knot" | "star" | "ball";

interface FaderLike {
  add<M extends { opacity: number }>(mat: M, base?: number): M;
}

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

const FRAG = /* glsl */ `
uniform sampler2D uMatcap;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uCut;
uniform float uLattice;
uniform float uStrut;
uniform vec2 uCells;
uniform float uTime;
uniform float uHeight;
varying vec3 vN;
varying vec3 vV;
varying vec2 vUv;
varying float vLy;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453) * 0.8 + 0.1;
}
// distance to the nearest voronoi cell border (F2 - F1), wrapped around u
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
  vec3 holo = vec3(0.4, 0.9, 1.0);
  float strutGlow = 0.0;
  if (uLattice > 0.5) {
    float e = cellEdge(vUv * uCells);
    if (e > uStrut) discard;
    strutGlow = smoothstep(uStrut * 0.55, uStrut, e);
  }
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 col = texture2D(uMatcap, n.xy * 0.48 + 0.5).rgb * uColor;
  if (!gl_FrontFacing) col *= 0.5;
  // printed layer lines
  col *= 0.9 + 0.1 * step(0.5, fract(vLy * 110.0));
  // holographic rim, glowing strut edges, rising scan band
  float fr = pow(1.0 - abs(dot(n, normalize(vV))), 2.2);
  col += holo * (fr * 0.45 + strutGlow * 0.35);
  float band = fract(vLy / uHeight * 0.5 - uTime * 0.22);
  col += holo * exp(-pow((band - 0.5) * 18.0, 2.0)) * 0.55;
  // hot edge where the nozzle is laying the current layer
  col += holo * smoothstep(0.03, 0.0, uCut - vLy) * 1.4;
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}`;

/** Neutral studio matcap (soft key light top-left) so the tints keep their hue. */
export function neutralMatcap(ctx: Pick<Ctx, "track">) {
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
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return ctx.track(tex);
}

function lathe(profile: [number, number][], segments = 64) {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

function sample(n: number, fn: (f: number) => [number, number]) {
  return Array.from({ length: n + 1 }, (_, i) => fn(i / n));
}

interface Spec {
  geo: () => THREE.BufferGeometry;
  color: number;
  height: number;
  lattice?: { cells: [number, number]; strut: number };
}

const SPECS: Record<PrintKind, Spec> = {
  latticeVase: {
    color: 0xf1f5f9,
    height: 0.78,
    lattice: { cells: [14, 9], strut: 0.13 },
    geo: () => lathe(sample(40, (f) => [0.2 + 0.09 * Math.sin(f * Math.PI * 1.15 + 0.35), f * 0.78])),
  },
  torso: {
    color: 0xfacc15,
    height: 0.98,
    lattice: { cells: [16, 13], strut: 0.12 },
    geo: () => {
      const keys: [number, number][] = [
        [0.13, 0],
        [0.17, 0.1],
        [0.2, 0.2],
        [0.17, 0.34],
        [0.13, 0.46],
        [0.17, 0.6],
        [0.2, 0.72],
        [0.21, 0.8],
        [0.14, 0.88],
        [0.065, 0.91],
        [0.06, 0.98],
      ];
      const pts = new THREE.SplineCurve(keys.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(60);
      const geo = new THREE.LatheGeometry(pts, 64);
      geo.scale(1, 1, 0.72);
      return geo;
    },
  },
  twistVase: {
    color: 0xef4444,
    height: 0.66,
    lattice: { cells: [4, 3], strut: 0.36 },
    geo: () => {
      const geo = lathe(sample(30, (f) => [0.17 + 0.05 * Math.sin(f * Math.PI), f * 0.66]), 6);
      const geo2 = geo.toNonIndexed();
      geo.dispose();
      const p = geo2.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const a = y * 2.4;
        const x = p.getX(i);
        const z = p.getZ(i);
        p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a));
      }
      geo2.computeVertexNormals();
      return geo2;
    },
  },
  rocket: {
    color: 0x22c55e,
    height: 0.82,
    geo: () => lathe([[0, 0], ...sample(40, (f) => [0.15 * Math.pow(Math.max(0, 1 - Math.pow(f, 1.7)), 0.7), f * 0.82] as [number, number])]),
  },
  knot: {
    color: 0x3b82f6,
    height: 0.5,
    geo: () => new THREE.TorusKnotGeometry(0.17, 0.045, 180, 16, 2, 3).translate(0, 0.25, 0),
  },
  star: {
    color: 0x4ade80,
    height: 0.06,
    geo: () => {
      const s = new THREE.Shape();
      const P = 8;
      for (let i = 0; i <= P * 2; i++) {
        const a = (i / (P * 2)) * Math.PI * 2 + Math.PI / 2;
        const r = i % 2 === 0 ? 0.42 : 0.26;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      for (let i = 0; i < P; i++) {
        const a = (i / P) * Math.PI * 2 + Math.PI / 2;
        const h = new THREE.Path();
        h.absarc(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.05, 0, Math.PI * 2, true);
        s.holes.push(h);
        const h2 = new THREE.Path();
        const b = a + Math.PI / P;
        h2.absarc(Math.cos(b) * 0.16, Math.sin(b) * 0.16, 0.035, 0, Math.PI * 2, true);
        s.holes.push(h2);
      }
      const center = new THREE.Path();
      center.absarc(0, 0, 0.07, 0, Math.PI * 2, true);
      s.holes.push(center);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 16 });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0.01, 0);
      return geo;
    },
  },
  ball: {
    color: 0xfde047,
    height: 0.56,
    lattice: { cells: [16, 9], strut: 0.13 },
    geo: () => new THREE.SphereGeometry(0.28, 64, 40).translate(0, 0.28, 0),
  },
};

export function buildPrints(ctx: Ctx, fader: FaderLike, kinds: PrintKind[], cut: { value: number } = { value: 99 }) {
  const matcap = neutralMatcap(ctx);
  const time = { value: 0 };
  const mats: THREE.ShaderMaterial[] = [];
  const meshes = {} as Record<PrintKind, THREE.Mesh>;
  for (const kind of kinds) {
    const spec = SPECS[kind];
    const mat = ctx.track(
      new THREE.ShaderMaterial({
        uniforms: {
          uMatcap: { value: matcap },
          uColor: { value: new THREE.Color(spec.color) },
          uOpacity: { value: 1 },
          uCut: cut,
          uLattice: { value: spec.lattice ? 1 : 0 },
          uStrut: { value: spec.lattice?.strut ?? 0 },
          uCells: { value: new THREE.Vector2(...(spec.lattice?.cells ?? [1, 1])) },
          uTime: time,
          uHeight: { value: Math.max(spec.height, 0.3) },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );
    mat.opacity = 1;
    fader.add(mat);
    mats.push(mat);
    meshes[kind] = new THREE.Mesh(ctx.track(spec.geo()), mat);
  }
  return {
    meshes,
    update(t: number) {
      time.value = t;
      for (const m of mats) {
        m.uniforms.uOpacity.value = m.opacity;
        // fully opaque objects can write depth so lattice behind lattice sorts right
        m.depthWrite = m.opacity > 0.98;
      }
    },
  };
}
