import * as THREE from "three";
import { canvas, drawCheckBadge, drawHolomedis, drawHomeTile, drawTicket, ecg, type HomeTile } from "./art";
import { buildPrints } from "./prints";

/**
 * The seven chapters of the show, each with its own 3D treatment:
 *   1 Check-in     a thick e-ticket whose QR is read by a scanner window
 *   2 Journey      a curved video-mapping wall assembled from flying tiles, lit by a projector cone
 *   3 DJ           a beat-driven equaliser, shockwave rings, stage beams
 *   4 Holomedis    a holographic assistant screen with a floating ECG
 *   5 Smart Living a voice command switching on 3D control tiles
 *   6 3D printing  the photo prints layer by layer beside objects rising from the plate
 *   7 Keepsake     a showcase of printed objects in a hologram column with sparks
 * The engine places each group in the tunnel; a chapter only animates its
 * own contents from `act` (0 far, 1 in focus) and `vis` (fade in/out).
 */

export interface Ctx {
  track: <D extends { dispose: () => void }>(d: D) => D;
  tex: (src: string) => THREE.Texture;
  dot: THREE.Texture;
  matcap: THREE.Texture;
  mobile: boolean;
}

export interface Frame {
  act: number;
  vis: number;
  time: number;
  dt: number;
}

export interface Chapter {
  group: THREE.Group;
  /** `side` is -1 when the chapter sits left of centre, +1 right, 0 centred (phones). */
  layout(width: number, side: number): void;
  update(frame: Frame): void;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep01 = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};

/** Materials whose opacity follows the chapter fade, each with its own base. */
class Fader {
  private list: { mat: { opacity: number }; base: number }[] = [];
  add<M extends { opacity: number }>(mat: M, base = mat.opacity): M {
    this.list.push({ mat, base });
    return mat;
  }
  apply(k: number) {
    for (const m of this.list) m.mat.opacity = m.base * k;
  }
}

function additive(ctx: Ctx, color: number, opacity: number, side: THREE.Side = THREE.FrontSide) {
  return ctx.track(
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side,
      fog: false,
    }),
  );
}

function canvasTexture(ctx: Ctx, c: HTMLCanvasElement) {
  const t = ctx.track(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function bracketGeometry(ctx: Ctx, L = 0.12) {
  const pts: number[] = [];
  for (const [cx, cy] of [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ]) {
    const sx = cx < 0 ? 1 : -1;
    const sy = cy < 0 ? 1 : -1;
    pts.push(cx, cy, 0, cx + sx * L, cy, 0, cx, cy, 0, cx, cy + sy * L, 0);
  }
  const g = ctx.track(new THREE.BufferGeometry());
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** A flat image with a coloured halo behind it and HUD corner brackets. */
function framedPanel(ctx: Ctx, mat: THREE.Material & { opacity: number }, tint: number, fader: Fader) {
  const root = new THREE.Group();
  const face = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 1)), mat);
  const glowMat = fader.add(
    ctx.track(
      new THREE.MeshBasicMaterial({
        map: ctx.dot,
        color: tint,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    ),
  );
  const glow = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 1)), glowMat);
  glow.position.z = -0.1;
  const lineMat = fader.add(ctx.track(new THREE.LineBasicMaterial({ color: tint, transparent: true, opacity: 0.95 })));
  const brackets = new THREE.LineSegments(bracketGeometry(ctx), lineMat);
  brackets.position.z = 0.02;
  root.add(glow, face, brackets);
  return {
    root,
    face,
    glow,
    setSize(w: number, h: number) {
      face.scale.set(w, h, 1);
      glow.scale.set(w * 1.6, h * 1.8, 1);
      brackets.scale.set(w * 1.04, h * 1.04, 1);
    },
  };
}

function photoMaterial(ctx: Ctx, src: string) {
  return ctx.track(new THREE.MeshBasicMaterial({ map: ctx.tex(src), transparent: true }));
}

/* ------------------------------------------------------------------ */
/* 1. Check-in: e-ticket whose QR is read by a scanner window          */
/* ------------------------------------------------------------------ */
/** The QR's white box in the 800×640 ticket art: centre and side, as fractions. */
const QR = { cx: 175.5 / 800, cy: 343.5 / 640, side: 259 / 800 };

function ticketChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();
  const [c, g] = canvas(800, 640);
  drawTicket(g);
  const faceMat = fader.add(ctx.track(new THREE.MeshBasicMaterial({ map: canvasTexture(ctx, c), transparent: true })), 1);
  const edgeMat = fader.add(ctx.track(new THREE.MeshBasicMaterial({ color: 0x3b1d7a, transparent: true })), 1);
  const card = new THREE.Group();
  const box = new THREE.Mesh(ctx.track(new THREE.BoxGeometry(1, 1, 1)), [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, edgeMat]);
  card.add(box);
  const glowMat = fader.add(
    ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0x7c3aed, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
  );
  const glow = new THREE.Sprite(glowMat);
  glow.position.z = -0.3;
  const brackets = new THREE.LineSegments(bracketGeometry(ctx, 0.1), fader.add(ctx.track(new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 1 }))));
  card.add(glow, brackets);
  group.add(card);

  // Scanner window sitting on the QR: four solid corner marks that close in
  // and lock, a scan band with a soft trail sweeping down the code, then a
  // green confirmation (ring + badge). All children of the card, so they
  // follow its tilt.
  const scanner = new THREE.Group();
  card.add(scanner);
  const cyan = new THREE.Color(0x22d3ee);
  const green = new THREE.Color(0x34d399);
  const cornerMat = fader.add(ctx.track(new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 1, depthWrite: false })), 1);
  const barGeo = ctx.track(new THREE.PlaneGeometry(1, 1));
  const corners: THREE.Group[] = [];
  for (const [sx, sy] of [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    const corner = new THREE.Group();
    const hBar = new THREE.Mesh(barGeo, cornerMat);
    const vBar = new THREE.Mesh(barGeo, cornerMat);
    corner.add(hBar, vBar);
    corner.userData = { sx, sy, hBar, vBar };
    scanner.add(corner);
    corners.push(corner);
  }

  const bandMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uPos: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0x67e8f9) } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uPos; uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          float d = vUv.y - uPos;                       // >0 above the line (already scanned)
          float line = smoothstep(0.012, 0.0, abs(d));
          float trail = d > 0.0 ? exp(-d * 9.0) * 0.32 : 0.0;
          float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          gl_FragColor = vec4(uColor, (line + trail) * edge * uOpacity);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const band = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 1)), bandMat);
  scanner.add(band);

  const ringMat = additive(ctx, 0x34d399, 0, THREE.DoubleSide);
  const ring = new THREE.Mesh(ctx.track(new THREE.RingGeometry(0.47, 0.5, 64)), ringMat);
  scanner.add(ring);

  const [bc, bg] = canvas(480, 120);
  drawCheckBadge(bg);
  const badgeMat = ctx.track(new THREE.MeshBasicMaterial({ map: canvasTexture(ctx, bc), transparent: true, opacity: 0, depthWrite: false }));
  const badge = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 120 / 480)), badgeMat);
  card.add(badge);

  let w = 4.4;
  let h = w / 1.25;
  let side = 1;
  const CYCLE = 4.2;
  return {
    group,
    layout(width) {
      // a touch smaller than the panels: the card tilts toward the camera
      w = width * 0.84;
      h = w / 1.25;
      box.scale.set(w, h, 0.08);
      brackets.scale.set(w * 1.05, h * 1.05, 1);
      brackets.position.z = 0.05;
      glow.scale.set(w * 1.8, h * 1.8, 1);
      side = QR.side * w;
      scanner.position.set((QR.cx - 0.5) * w, (0.5 - QR.cy) * h, 0.05);
      band.scale.set(side * 1.02, side * 1.02, 1);
      band.position.z = 0.01;
      ring.scale.setScalar(side);
      ring.position.z = 0.02;
      badge.scale.setScalar(w * 0.5);
      const t = side * 0.035;
      const len = side * 0.2;
      for (const corner of corners) {
        const { hBar, vBar } = corner.userData as { hBar: THREE.Mesh; vBar: THREE.Mesh; sx: number; sy: number };
        const { sx, sy } = corner.userData as { sx: number; sy: number };
        hBar.scale.set(len, t, 1);
        hBar.position.set(-sx * (len / 2 - t / 2), 0, 0);
        vBar.scale.set(t, len, 1);
        vBar.position.set(0, -sy * (len / 2 - t / 2), 0);
      }
    },
    update({ act, vis, time }) {
      fader.apply(vis);
      card.rotation.x = (1 - act) * 0.5 - 0.05;
      card.rotation.y = Math.sin(time * 0.5) * 0.07;

      // 0–0.7 s seek (marks close in) · 0.7–2.3 s scan sweep · 2.3–3.7 s verified · fade out
      const cyc = time % CYCLE;
      const seek = smoothstep01(cyc / 0.7);
      const scan = clamp((cyc - 0.7) / 1.6);
      const done = clamp((cyc - 2.3) / 0.25) * clamp((CYCLE - 0.3 - cyc) / 0.3);
      const spread = side * (0.62 - 0.1 * seek + 0.04 * Math.sin(time * 3) * (1 - seek));
      for (const corner of corners) {
        const { sx, sy } = corner.userData as { sx: number; sy: number };
        corner.position.set(sx * spread * (1 - 0.06 * done), sy * spread * (1 - 0.06 * done), 0.03);
      }
      cornerMat.color.copy(cyan).lerp(green, done);
      cornerMat.opacity = vis * (0.35 + 0.65 * seek) * clamp((CYCLE - 0.15 - cyc) / 0.3);

      const scanning = cyc > 0.7 && cyc < 2.3;
      bandMat.uniforms.uPos.value = 1 - scan;
      bandMat.uniforms.uOpacity.value = vis * act * (scanning ? Math.sin(scan * Math.PI) ** 0.35 : 0);

      const pulse = clamp((cyc - 2.3) / 0.9);
      ring.scale.setScalar(side * (1 + pulse * 0.9));
      ringMat.opacity = vis * act * (cyc > 2.3 ? (1 - pulse) * 0.8 : 0);

      badgeMat.opacity = vis * done;
      const pop = 1 + 0.08 * Math.sin(clamp((cyc - 2.3) / 0.3) * Math.PI);
      badge.scale.set(w * 0.5 * pop, w * 0.5 * pop, 1);
      // floats just above the card's top edge, over the QR side
      badge.position.set(scanner.position.x + side * 0.45, h / 2 + w * 0.08 + done * 0.06, 0.3 + done * 0.15);
    },
  };
}

/* ------------------------------------------------------------------ */
/* 2. Journey of Life: curved screen + projector cone                  */
/* ------------------------------------------------------------------ */
function projectionChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();
  const aspect = 1400 / 1253;
  const cols = ctx.mobile ? 6 : 8;
  const rows = ctx.mobile ? 4 : 5;
  const curve = 0.28;
  const bendZ = (x: number) => curve * 4 * x * x;

  // The projection wall is cut into tiles that fly in from scattered
  // positions and lock together as the chapter comes into focus, the way a
  // video-mapping rig stitches many surfaces into one picture.
  const screenMat = fader.add(photoMaterial(ctx, "/experience/journey-of-life.jpg"), 1);
  screenMat.side = THREE.DoubleSide;
  type Tile = { mesh: THREE.Mesh; x: number; y: number; delay: number; off: THREE.Vector3; spin: THREE.Vector3 };
  const tiles: Tile[] = [];
  const tileGroup = new THREE.Group();
  group.add(tileGroup);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const g = ctx.track(new THREE.PlaneGeometry(1 / cols, 1 / rows));
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (i + uv.getX(k)) / cols, (j + uv.getY(k)) / rows);
      const mesh = new THREE.Mesh(g, screenMat);
      tileGroup.add(mesh);
      const x = (i + 0.5) / cols - 0.5;
      const y = (j + 0.5) / rows - 0.5;
      tiles.push({
        mesh,
        x,
        y,
        // tiles near the centre lock first, the rest follow outward
        delay: Math.hypot(x, y) * 0.5 + Math.random() * 0.14,
        off: new THREE.Vector3((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.8, 0.8 + Math.random() * 2.2),
        spin: new THREE.Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.2),
      });
    }
  }

  // light sweeping across the wall and glowing along the tile seams
  const bandGeo = ctx.track(new THREE.PlaneGeometry(1, 1, 48, 1));
  const bandPos = bandGeo.attributes.position as THREE.BufferAttribute;
  for (let k = 0; k < bandPos.count; k++) bandPos.setZ(k, bendZ(bandPos.getX(k)) + 0.03);
  const bandMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: {
        uPos: { value: 0 },
        uOpacity: { value: 0 },
        uGrid: { value: new THREE.Vector2(cols, rows) },
        uColor: { value: new THREE.Color(0x7dd3fc) },
      },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uPos; uniform float uOpacity; uniform vec2 uGrid; uniform vec3 uColor; varying vec2 vUv;
        float seam(float v){ float f = fract(v); return smoothstep(0.035, 0.0, min(f, 1.0 - f)); }
        void main(){
          float d = vUv.x - uPos;
          float band = exp(-d * d * 120.0);
          float lines = max(seam(vUv.x * uGrid.x), seam(vUv.y * uGrid.y));
          float a = band * 0.5 + lines * (0.16 + band * 0.5);
          gl_FragColor = vec4(uColor, a * uOpacity);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const band = new THREE.Mesh(bandGeo, bandMat);
  group.add(band);

  const haloMat = fader.add(
    ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0x3b82f6, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
  );
  const halo = new THREE.Sprite(haloMat);
  halo.position.z = -0.4;
  group.add(halo);

  // projector beam: four faces from the lens to the screen corners, brighter at the lens
  const beamGeo = ctx.track(new THREE.BufferGeometry());
  const beamPos = new Float32Array(12 * 3);
  const beamAlpha = new Float32Array(12);
  for (let i = 0; i < 4; i++) {
    beamAlpha.set([0.3, 0.015, 0.015], i * 3);
  }
  beamGeo.setAttribute("position", new THREE.BufferAttribute(beamPos, 3));
  beamGeo.setAttribute("alpha", new THREE.BufferAttribute(beamAlpha, 1));
  const beamMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0x93c5fd) }, uOpacity: { value: 1 } },
      vertexShader: "attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 uColor; uniform float uOpacity; varying float vA; void main(){ gl_FragColor = vec4(uColor, vA * uOpacity); }",
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const beam = new THREE.Mesh(beamGeo, beamMat);
  const lens = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0xe0f2fe, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  group.add(beam, lens);

  // dust drifting inside the beam
  const dustN = ctx.mobile ? 70 : 140;
  const dustGeo = ctx.track(new THREE.BufferGeometry());
  const dustPos = new Float32Array(dustN * 3);
  const dustSeed = Array.from({ length: dustN }, () => [Math.random(), Math.random() - 0.5, Math.random() - 0.5]);
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = fader.add(
    ctx.track(new THREE.PointsMaterial({ size: 0.06, map: ctx.dot, color: 0xbfdbfe, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })),
  );
  group.add(new THREE.Points(dustGeo, dustMat));

  let w = 4.4;
  let h = w / aspect;
  const lensPos = new THREE.Vector3();
  return {
    group,
    layout(width) {
      w = width;
      h = w / aspect;
      w *= 0.92;
      h *= 0.92;
      band.scale.set(w, h, 1);
      halo.scale.set(w * 1.9, h * 1.9, 1);
      lensPos.set(0, h * 0.75, 3.0);
      lens.position.copy(lensPos);
      lens.scale.set(0.7, 0.7, 1);
      const corners = [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0.5, 0.5],
        [-0.5, 0.5],
      ].map(([x, y]) => [x * w, y * h, bendZ(x)]);
      for (let i = 0; i < 4; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % 4];
        beamPos.set([lensPos.x, lensPos.y, lensPos.z, a[0], a[1], a[2], b[0], b[1], b[2]], i * 9);
      }
      beamGeo.attributes.position.needsUpdate = true;
    },
    update({ act, vis, time, dt }) {
      fader.apply(vis);
      beamMat.uniforms.uOpacity.value = vis * (0.2 + 0.5 * act);
      for (const t of tiles) {
        const e = smoothstep01((act * 1.15 - t.delay) / 0.5);
        const k = 1 - e;
        const ripple = Math.sin(t.x * 9 + time * 1.4) * 0.03 * e;
        t.mesh.position.set(t.x * w + t.off.x * k, t.y * h + t.off.y * k, bendZ(t.x) + ripple + t.off.z * k);
        t.mesh.rotation.set(t.spin.x * k, t.spin.y * k, t.spin.z * k);
        t.mesh.scale.set(w * 0.965, h * 0.965, 1);
      }
      bandMat.uniforms.uPos.value = ((time * 0.16) % 1.5) - 0.25;
      bandMat.uniforms.uOpacity.value = vis * smoothstep01((act - 0.55) / 0.45);
      for (let i = 0; i < dustN; i++) {
        const s = dustSeed[i];
        s[0] = (s[0] + dt * 0.05) % 1;
        const t = s[0];
        const tx = s[1] * w;
        const ty = s[2] * h;
        dustPos[i * 3] = lensPos.x + (tx - lensPos.x) * t + Math.sin(time + i) * 0.05;
        dustPos[i * 3 + 1] = lensPos.y + (ty - lensPos.y) * t;
        dustPos[i * 3 + 2] = lensPos.z + (0.2 - lensPos.z) * t;
      }
      dustGeo.attributes.position.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------------ */
/* 3. DJ: beat-driven equaliser, shockwaves, sweeping stage lights     */
/* ------------------------------------------------------------------ */
function djChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();
  const aspect = 1400 / 1269;
  const mat = fader.add(photoMaterial(ctx, "/experience/dj.jpg"), 1);
  const panel = framedPanel(ctx, mat, 0xd946ef, fader);
  group.add(panel.root);

  const BARS = ctx.mobile ? 20 : 32;
  const barMat = fader.add(ctx.track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, fog: false })), 0.95);
  const bars = new THREE.InstancedMesh(ctx.track(new THREE.BoxGeometry(1, 1, 1)), barMat, BARS);
  const cA = new THREE.Color(0x22d3ee);
  const cB = new THREE.Color(0xe879f9);
  for (let i = 0; i < BARS; i++) bars.setColorAt(i, cA.clone().lerp(cB, i / (BARS - 1)));
  group.add(bars);

  const rings: THREE.Mesh[] = [];
  for (let j = 0; j < 3; j++) {
    const ring = new THREE.Mesh(ctx.track(new THREE.RingGeometry(0.985, 1, 96)), additive(ctx, j === 1 ? 0x22d3ee : 0xe879f9, 0.5, THREE.DoubleSide));
    ring.position.z = -0.25;
    group.add(ring);
    rings.push(ring);
  }

  const coneGeo = ctx.track(new THREE.ConeGeometry(1, 1, 24, 1, true));
  coneGeo.translate(0, -0.5, 0);
  const beams: THREE.Mesh[] = [];
  [0x22d3ee, 0xa855f7, 0xe879f9, 0x60a5fa].forEach((color) => {
    const b = new THREE.Mesh(coneGeo, additive(ctx, color, 0.07, THREE.DoubleSide));
    group.add(b);
    beams.push(b);
  });

  const m = new THREE.Matrix4();
  let w = 4.4;
  let h = w / aspect;
  return {
    group,
    layout(width) {
      w = width;
      h = w / aspect;
      panel.setSize(w, h);
      beams.forEach((b, i) => {
        b.position.set((i - 1.5) * w * 0.32, h * 0.62, 0.3);
        b.scale.set(0.55, h * 1.5, 0.55);
      });
    },
    update({ act, vis, time }) {
      fader.apply(vis);
      const beat = (time * 124) / 60;
      const ph = beat % 1;
      const kick = Math.exp(-ph * 7) * act;
      const hat = Math.exp(-((beat * 2) % 1) * 9);
      panel.root.scale.setScalar(1 + kick * 0.025);
      (panel.glow.material as THREE.MeshBasicMaterial).opacity = vis * (0.4 + kick * 0.6);

      const span = w * 1.04;
      const barW = (span / BARS) * 0.5;
      for (let i = 0; i < BARS; i++) {
        const f = i / (BARS - 1);
        const level = clamp(
          kick * (1 - f) * 0.9 + hat * 0.25 * f + 0.22 * Math.abs(Math.sin(time * 3.1 + i * 0.7)) + 0.18 * Math.abs(Math.sin(time * 1.7 + i * 1.9)),
        );
        const bh = 0.04 + level * h * 0.26 * (0.3 + 0.7 * act);
        const x = -span / 2 + (i + 0.5) * (span / BARS);
        m.makeScale(barW, bh, barW);
        m.setPosition(x, -h / 2 - 0.08 + bh / 2, 0.3 + Math.sin(f * Math.PI) * 0.25);
        bars.setMatrixAt(i, m);
      }
      bars.instanceMatrix.needsUpdate = true;

      rings.forEach((ring, j) => {
        const p = (beat + j / 3) % 1;
        const s = w * 0.42 * (1 + p * 1.1);
        ring.scale.set(s, s, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.55 * vis * act;
      });
      beams.forEach((b, i) => {
        b.rotation.z = Math.sin(time * 0.9 + i * 1.7) * 0.55;
        b.rotation.x = 0.35 + Math.sin(time * 0.6 + i) * 0.15;
        (b.material as THREE.MeshBasicMaterial).opacity = vis * act * (0.05 + hat * 0.06);
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* 4. Holomedis AI: hologram screen + floating ECG + scanlines         */
/* ------------------------------------------------------------------ */
function holomedisChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();
  const aspect = 1024 / 768;
  const [c, g] = canvas(1024, 768);
  drawHolomedis(g, 0);
  const tex = canvasTexture(ctx, c);
  const mat = fader.add(ctx.track(new THREE.MeshBasicMaterial({ map: tex, transparent: true })), 1);
  const panel = framedPanel(ctx, mat, 0xa855f7, fader);
  group.add(panel.root);

  const scanMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uTime; uniform float uOpacity; varying vec2 vUv;
        void main(){
          float lines = step(0.5, fract(vUv.y * 140.0 - uTime * 3.0)) * 0.05;
          float sweep = smoothstep(0.06, 0.0, abs(fract(vUv.y - uTime * 0.18) - 0.5) - 0.44);
          gl_FragColor = vec4(vec3(0.4, 0.9, 1.0), (lines + sweep * 0.16) * uOpacity);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const scan = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 1)), scanMat);
  scan.position.z = 0.03;
  group.add(scan);

  const N = 220;
  const ecgGeo = ctx.track(new THREE.BufferGeometry());
  const ecgPos = new Float32Array(N * 3);
  ecgGeo.setAttribute("position", new THREE.BufferAttribute(ecgPos, 3));
  const ecgMat = fader.add(ctx.track(new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 1 })));
  const ecgLine = new THREE.Line(ecgGeo, ecgMat);
  const ecgGlow = new THREE.Line(ecgGeo, fader.add(ctx.track(new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }))));
  ecgGlow.position.z = -0.02;
  group.add(ecgLine, ecgGlow);

  const head = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0xa5f3fc, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  group.add(head);

  const pulses: THREE.Mesh[] = [];
  for (let j = 0; j < 2; j++) {
    const r = new THREE.Mesh(ctx.track(new THREE.RingGeometry(0.94, 1, 64)), additive(ctx, 0xe879f9, 0.6, THREE.DoubleSide));
    group.add(r);
    pulses.push(r);
  }

  let w = 4.4;
  let h = w / aspect;
  let lastDraw = -1;
  return {
    group,
    layout(width) {
      w = width;
      h = w / aspect;
      panel.setSize(w, h);
      scan.scale.set(w, h, 1);
    },
    update({ act, vis, time }) {
      fader.apply(vis);
      scanMat.uniforms.uTime.value = time;
      scanMat.uniforms.uOpacity.value = vis * act;
      if (vis > 0.05 && time - lastDraw > 1 / 24) {
        lastDraw = time;
        drawHolomedis(g, time);
        tex.needsUpdate = true;
      }
      // ECG floats 0.45 in front of the strip drawn on the screen
      const x0 = (56 / 1024 - 0.5) * w;
      const x1 = ((1024 - 56) / 1024 - 0.5) * w;
      const yc = (0.5 - 260 / 768) * h;
      const amp = (48 / 768) * h;
      const z = 0.12 + 0.35 * act;
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1);
        ecgPos[i * 3] = x0 + (x1 - x0) * f;
        ecgPos[i * 3 + 1] = yc + ecg(f * 3 - time * 1.2) * amp;
        ecgPos[i * 3 + 2] = z;
      }
      ecgGeo.attributes.position.needsUpdate = true;
      head.position.set(x0 + (x1 - x0) * 0.98, yc + ecg(0.98 * 3 - time * 1.2) * amp, z);
      head.scale.setScalar(0.35);

      const ax = (116 / 1024 - 0.5) * w;
      const ay = (0.5 - 116 / 768) * h;
      const beat = (time * 72) / 60;
      pulses.forEach((r, j) => {
        const p = (beat + j * 0.5) % 1;
        const s = (52 / 1024) * w * (1 + p * 2.2);
        r.position.set(ax, ay, 0.2);
        r.scale.set(s, s, 1);
        (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7 * vis * act;
      });
      panel.root.position.y = Math.sin(time * 0.8) * 0.04;
    },
  };
}

/* ------------------------------------------------------------------ */
/* 5. Smart Living: voice command switches on 3D control tiles       */
/* ------------------------------------------------------------------ */
function smartHomeChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();
  const aspect = 1400 / 1140;
  const photo = fader.add(photoMaterial(ctx, "/experience/smarthome.jpg"), 1);
  const panel = framedPanel(ctx, photo, 0xf59e0b, fader);
  group.add(panel.root);

  // three control tiles (lamp, curtains, mood) that switch on one by one
  // after the voice command; solid slabs with a lit face, not wireframe
  const TILES: HomeTile[] = [
    { label: "Lampu", on: "Hangat 40%", off: "Mati", icon: "lamp" },
    { label: "Tirai", on: "Tertutup", off: "Terbuka", icon: "curtain" },
    { label: "Suasana", on: "Mode santai", off: "Normal", icon: "mood" },
  ];
  const tileGeo = ctx.track(new THREE.BoxGeometry(1, 150 / 360, 0.06));
  const tileEdge = fader.add(ctx.track(new THREE.MeshBasicMaterial({ color: 0x1c1530, transparent: true })), 1);
  const tileGlowMat = (): THREE.SpriteMaterial =>
    ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0xf59e0b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const tiles = TILES.map((tile) => {
    const faces = [false, true].map((on) => {
      const [tc, tg] = canvas(360, 150);
      drawHomeTile(tg, tile, on);
      return canvasTexture(ctx, tc);
    });
    const faceMat = ctx.track(new THREE.MeshBasicMaterial({ map: faces[0], transparent: true }));
    const mesh = new THREE.Mesh(tileGeo, [tileEdge, tileEdge, tileEdge, tileEdge, faceMat, tileEdge]);
    const halo = new THREE.Sprite(tileGlowMat());
    halo.position.z = -0.1;
    const root = new THREE.Group();
    root.add(halo, mesh);
    group.add(root);
    return { root, mesh, faceMat, faces, halo, lit: false };
  });

  // voice orb + waveform ring
  const orb = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0xfcd34d, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  const WN = 128;
  const waveGeo = ctx.track(new THREE.BufferGeometry());
  const wavePos = new Float32Array(WN * 3);
  waveGeo.setAttribute("position", new THREE.BufferAttribute(wavePos, 3));
  const wave = new THREE.LineLoop(waveGeo, fader.add(ctx.track(new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 1 }))));
  const [lc, lg] = canvas(640, 120);
  lg.fillStyle = "rgba(20,12,4,0.75)";
  lg.beginPath();
  lg.roundRect?.(4, 4, 632, 112, 56);
  if (!lg.roundRect) lg.rect(4, 4, 632, 112);
  lg.fill();
  lg.strokeStyle = "rgba(251,191,36,0.7)";
  lg.lineWidth = 3;
  lg.stroke();
  lg.fillStyle = "#fde68a";
  lg.font = "500 40px ui-sans-serif, system-ui, sans-serif";
  lg.textAlign = "center";
  lg.fillText("“Nyalakan mode santai”", 320, 74);
  const label = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 120 / 640)), fader.add(ctx.track(new THREE.MeshBasicMaterial({ map: canvasTexture(ctx, lc), transparent: true, depthWrite: false })), 1));
  group.add(orb, wave, label);

  let w = 4.4;
  let h = w / aspect;
  const orbPos = new THREE.Vector3();
  let labelX = 0;
  let tileX = 0;
  let tileRy = 0;
  const warm = new THREE.Color(1, 0.86, 0.68);
  const white = new THREE.Color(1, 1, 1);
  return {
    group,
    layout(width, side) {
      w = width;
      h = w / aspect;
      panel.setSize(w, h);
      panel.root.position.z = -0.25;
      const inner = side === 0 ? 1 : -side;
      tileX = inner * w * 0.4;
      tileRy = -inner * 0.38;
      tiles.forEach((t, i) => {
        t.root.scale.setScalar(w * 0.3);
        t.root.position.set(tileX, h * 0.24 - i * w * 0.155, 0.55);
        t.root.rotation.y = tileRy;
        t.halo.scale.set(1.6, 0.9, 1);
      });
      orbPos.set(-inner * w * 0.3, -h * 0.25, 0.8);
      orb.position.copy(orbPos);
      orb.scale.set(0.6, 0.6, 1);
      label.scale.set(w * 0.42, w * 0.42, 1);
      label.position.set(-inner * w * 0.18, h * 0.02, 0.9);
      labelX = -inner * w * 0.18;
    },
    update({ act, vis, time }) {
      fader.apply(vis);
      // a 6 s loop: speak (0-2 s), lights go on one by one, mood warms, then reset
      const cyc = time % 6;
      const speaking = cyc < 2.2 ? Math.sin((cyc / 2.2) * Math.PI) : 0;
      tiles.forEach((t, i) => {
        const on = clamp((cyc - 2.2 - i * 0.35) / 0.3) * clamp((5.6 - cyc) / 0.4);
        const lit = on > 0.5;
        if (lit !== t.lit) {
          t.lit = lit;
          t.faceMat.map = t.faces[lit ? 1 : 0];
          t.faceMat.needsUpdate = true;
        }
        t.faceMat.opacity = vis;
        (t.halo.material as THREE.SpriteMaterial).opacity = vis * on * 0.55;
        t.mesh.position.z = on * 0.12;
        t.root.rotation.y = tileRy + Math.sin(time * 0.6 + i) * 0.05;
        t.root.position.x = tileX;
      });
      const mood = clamp((cyc - 3.6) / 0.8) * clamp((5.8 - cyc) / 0.4);
      photo.color.copy(white).lerp(warm, mood * act);
      const R = w * 0.09;
      for (let i = 0; i < WN; i++) {
        const a = (i / WN) * Math.PI * 2;
        const r = R * (1 + (0.1 + 0.45 * speaking) * Math.sin(a * 6 + time * 7) * Math.sin(a * 3 - time * 4));
        wavePos[i * 3] = orbPos.x + Math.cos(a) * r;
        wavePos[i * 3 + 1] = orbPos.y + Math.sin(a) * r;
        wavePos[i * 3 + 2] = orbPos.z;
      }
      waveGeo.attributes.position.needsUpdate = true;
      orb.scale.setScalar(0.45 + speaking * 0.35);
      label.position.set(labelX, h * 0.02 + Math.sin(time * 1.1) * 0.05, 0.9);
    },
  };
}

/* ------------------------------------------------------------------ */
/* 6. 3D printing: photo prints layer by layer, objects rise beside it  */
/* ------------------------------------------------------------------ */
function printChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();
  const aspect = 1070 / 600;
  const map = ctx.tex("/experience/print3d.jpg");
  const printMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { map: { value: map }, uProgress: { value: 1 }, uFade: { value: 1 }, uTint: { value: new THREE.Color(0x67e8f9) } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform sampler2D map; uniform float uProgress; uniform float uFade; uniform vec3 uTint; varying vec2 vUv;
        void main(){
          vec4 c = texture2D(map, vUv);
          float layer = 0.9 + 0.1 * step(0.5, fract(vUv.y * 160.0));
          vec3 col = c.rgb * layer;
          if (vUv.y > uProgress) {
            float ghost = step(0.5, fract(vUv.y * 80.0)) * 0.06;
            col = c.rgb * 0.05 + uTint * ghost;
          }
          col += uTint * smoothstep(0.025, 0.0, abs(vUv.y - uProgress)) * 1.3;
          gl_FragColor = vec4(col * uFade, uFade);
          #include <colorspace_fragment>
        }`,
      transparent: true,
    }),
  );
  const photo = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 1)), printMat);
  const glowMat = fader.add(
    ctx.track(new THREE.MeshBasicMaterial({ map: ctx.dot, color: 0x818cf8, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
  );
  const glow = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 1)), glowMat);
  glow.position.z = -0.1;
  const brackets = new THREE.LineSegments(bracketGeometry(ctx), fader.add(ctx.track(new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 1 }))));
  group.add(glow, photo, brackets);

  // three objects rise layer by layer: everything above the cut is hidden
  const cut = { value: 99 };
  const prints = buildPrints(ctx, fader, ["latticeVase", "rocket", "twistVase"], cut);
  prints.meshes.latticeVase.position.x = -0.64;
  prints.meshes.twistVase.position.x = 0.64;
  const printer = new THREE.Group();
  printer.add(...Object.values(prints.meshes));
  const layerMat = fader.add(additive(ctx, 0x67e8f9, 0.45, THREE.DoubleSide));
  const layer = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(2.3, 0.75)), layerMat);
  layer.rotation.x = -Math.PI / 2;
  const nozzle = new THREE.Mesh(ctx.track(new THREE.ConeGeometry(0.07, 0.18, 16)), fader.add(ctx.track(new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true }))));
  nozzle.rotation.x = Math.PI;
  const plate = new THREE.Mesh(ctx.track(new THREE.BoxGeometry(2.5, 0.04, 0.95)), fader.add(ctx.track(new THREE.MeshBasicMaterial({ color: 0x1e1b4b, transparent: true }))));
  plate.position.y = -0.08;
  printer.add(layer, nozzle, plate);
  group.add(printer);

  const BOTTOM = 0;
  const TOP = 0.84;
  let w = 4.4;
  let h = w / aspect;
  return {
    group,
    layout(width, side) {
      w = width;
      h = w / aspect;
      photo.scale.set(w, h, 1);
      glow.scale.set(w * 1.6, h * 1.9, 1);
      brackets.scale.set(w * 1.04, h * 1.04, 1);
      const inner = side === 0 ? 1 : -side;
      printer.scale.setScalar(w * 0.13);
      printer.position.set(inner * w * 0.38, -h * 0.5 + 0.02, 0.8);
    },
    update({ act, vis, time }) {
      fader.apply(vis);
      // 7 s cycle: print for 5 s, hold, restart; frozen fully printed when out of focus
      const cyc = time % 7;
      const p = act > 0.3 ? clamp(cyc / 5) : 1;
      printMat.uniforms.uProgress.value = p * 1.02;
      printMat.uniforms.uFade.value = vis * (0.35 + 0.65 * act);
      const printing = p < 1;
      const y = BOTTOM + (TOP - BOTTOM) * p;
      cut.value = printing ? y : 99;
      prints.update(time);
      layer.position.y = y;
      layer.visible = printing;
      nozzle.position.set(Math.sin(time * 3.1) * 0.8, y + 0.13, Math.sin(time * 7.3) * 0.16);
      nozzle.visible = printing;
      printer.rotation.y = -0.5 + Math.sin(time * 0.4) * 0.35;
    },
  };
}

/* ------------------------------------------------------------------ */
/* 7. Keepsake: printed objects on a turntable inside a hologram column */
/* ------------------------------------------------------------------ */
function keepsakeChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();

  // a little gallery of typical prints; lattice pieces show their holes against the light
  const prints = buildPrints(ctx, fader, ["torso", "latticeVase", "twistVase", "ball", "rocket", "knot", "star"]);
  const P = prints.meshes;
  P.torso.position.set(0.04, 0, -0.36);
  P.latticeVase.position.set(-0.6, 0, -0.12);
  P.twistVase.position.set(0.6, 0, -0.14);
  P.ball.position.set(-0.3, 0, 0.42);
  P.rocket.position.set(0.4, 0, 0.4);
  P.rocket.scale.setScalar(0.85);
  P.knot.position.set(0.6, 0.8, -0.14);
  P.star.rotation.x = Math.PI / 2;
  P.star.scale.setScalar(0.75);
  P.star.position.set(-0.62, 1.12, -0.22);
  const cluster = new THREE.Group();
  cluster.add(...Object.values(P));
  cluster.scale.setScalar(1.3);

  const pedestal = new THREE.Mesh(
    ctx.track(new THREE.CylinderGeometry(1.26, 1.36, 0.22, 96)),
    fader.add(ctx.track(new THREE.MeshMatcapMaterial({ matcap: ctx.matcap, color: 0x3b3355, transparent: true, opacity: 1 }))),
  );
  pedestal.position.y = -0.11;
  const rim = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(1.27, 0.014, 8, 128)), fader.add(additive(ctx, 0x67e8f9, 1)));
  rim.rotation.x = Math.PI / 2;

  // hologram column rising from the rim: fades upward, thin vertical streaks
  const COL_H = 2.6;
  const columnMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1 }, uTime: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uOpacity; uniform float uTime; varying vec2 vUv;
        void main(){
          float fade = pow(1.0 - vUv.y, 2.2);
          float streak = 0.35 + 0.65 * smoothstep(0.82, 1.0, sin(vUv.x * 6.2832 * 36.0 + uTime * 0.6) * 0.5 + 0.5);
          float flicker = 0.85 + 0.15 * sin(uTime * 9.0 + vUv.y * 40.0);
          vec3 col = vec3(0.35, 0.85, 1.0) * fade * streak * flicker * 0.5;
          gl_FragColor = vec4(col * uOpacity, 1.0);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  columnMat.opacity = 1;
  fader.add(columnMat);
  const column = new THREE.Mesh(ctx.track(new THREE.CylinderGeometry(1.27, 1.27, COL_H, 96, 1, true).translate(0, COL_H / 2, 0)), columnMat);
  const scanMat = fader.add(additive(ctx, 0x67e8f9, 0.9));
  const scan = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(1.27, 0.01, 6, 128)), scanMat);
  scan.rotation.x = Math.PI / 2;
  const scanDisc = new THREE.Mesh(ctx.track(new THREE.CircleGeometry(1.27, 96)), fader.add(additive(ctx, 0x67e8f9, 0.08, THREE.DoubleSide)));
  scanDisc.rotation.x = -Math.PI / 2;

  const ORBIT_R = 1.5;
  const GY = 0.95;
  const orbit = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(ORBIT_R, 0.008, 8, 160)), fader.add(additive(ctx, 0xe879f9, 0.7)));
  const orbitNode = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0xf5d0fe, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  orbitNode.scale.set(0.26, 0.26, 1);
  // backlight so the lattice openings read as holes
  const spot = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0x7c3aed, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  spot.scale.set(5, 5, 1);
  spot.position.set(0, 1.1, -1.1);

  const stand = new THREE.Group();
  stand.add(spot, pedestal, rim, column, scan, scanDisc, cluster, orbit, orbitNode);
  group.add(stand);

  const SN = ctx.mobile ? 90 : 180;
  const sparkGeo = ctx.track(new THREE.BufferGeometry());
  const sparkPos = new Float32Array(SN * 3);
  const seeds = Array.from({ length: SN }, () => [Math.random(), Math.random() * Math.PI * 2, 0.3 + Math.random() * 1.0]);
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    fader.add(ctx.track(new THREE.PointsMaterial({ size: 0.07, map: ctx.dot, color: 0x99f6e4, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }))),
  );
  stand.add(sparks);

  return {
    group,
    layout(width) {
      stand.scale.setScalar(width * 0.31);
      stand.position.set(width * (ctx.mobile ? 0.08 : 0.2), -width * 0.3, 0.4);
    },
    update({ act, vis, time, dt }) {
      fader.apply(vis);
      prints.update(time);
      columnMat.uniforms.uOpacity.value = columnMat.opacity;
      columnMat.uniforms.uTime.value = time;
      cluster.rotation.y = Math.sin(time * 0.3) * 0.55;
      cluster.position.y = 0.04 + Math.sin(time * 1.1) * 0.03 * act;
      P.knot.rotation.set(time * 0.7, time * 0.9, 0);
      P.knot.position.y = 0.8 + Math.sin(time * 1.4) * 0.04;
      P.star.rotation.y = time * 0.8;
      P.star.position.y = 1.12 + Math.sin(time * 1.2 + 1) * 0.04;
      // scan ring sweeps up through the prints every 3.2 s
      const k = (time % 3.2) / 3.2;
      const sy = k * COL_H * 0.75;
      scan.position.y = sy;
      scanDisc.position.y = sy;
      scanMat.opacity = 0.9 * vis * Math.sin(k * Math.PI);
      orbit.rotation.set(Math.PI / 2 + 0.3, 0, time * 0.5);
      orbit.position.y = GY;
      const a = time * 1.2;
      orbitNode.position.set(Math.cos(a) * ORBIT_R, GY + Math.sin(a) * ORBIT_R * Math.sin(0.3), Math.sin(a) * ORBIT_R * Math.cos(0.3));
      for (let i = 0; i < SN; i++) {
        const s = seeds[i];
        s[0] = (s[0] + dt * (0.1 + (i % 5) * 0.02)) % 1;
        const ang = s[1] + time * 0.35;
        sparkPos[i * 3] = Math.cos(ang) * s[2];
        sparkPos[i * 3 + 1] = s[0] * COL_H;
        sparkPos[i * 3 + 2] = Math.sin(ang) * s[2];
      }
      sparkGeo.attributes.position.needsUpdate = true;
    },
  };
}

export const chapterFactories: ((ctx: Ctx) => Chapter)[] = [
  ticketChapter,
  projectionChapter,
  djChapter,
  holomedisChapter,
  smartHomeChapter,
  printChapter,
  keepsakeChapter,
];
