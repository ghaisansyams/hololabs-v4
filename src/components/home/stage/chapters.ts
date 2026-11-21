import * as THREE from "three";
import { canvas, drawHolomedis, drawSouvenir, drawTicket, ecg } from "./art";

/**
 * The seven chapters of the show, each with its own 3D treatment:
 *   1 Check-in     a thick e-ticket card swept by a QR scanner beam
 *   2 Journey      a curved projection screen lit by a projector cone
 *   3 DJ           a beat-driven equaliser, shockwave rings, stage beams
 *   4 Holomedis    a holographic assistant screen with a floating ECG
 *   5 Smart Living a wireframe house whose lights follow a voice wave
 *   6 3D printing  the photo prints layer by layer beside a growing vase
 *   7 Keepsake     the finished vase on a turntable with rising sparks
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
/* 1. Check-in: e-ticket + QR scanner                                  */
/* ------------------------------------------------------------------ */
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

  // scanner: a bright line plus a translucent fan from the emitter above
  const laser = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1, 1)), fader.add(additive(ctx, 0x67e8f9, 1)));
  const fanGeo = ctx.track(new THREE.BufferGeometry());
  const fanPos = new Float32Array(9);
  fanGeo.setAttribute("position", new THREE.BufferAttribute(fanPos, 3));
  const fan = new THREE.Mesh(fanGeo, fader.add(additive(ctx, 0x22d3ee, 0.16, THREE.DoubleSide)));
  const emitter = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0xa5f3fc, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  group.add(laser, fan, emitter);

  let w = 4.4;
  let h = w / 1.25;
  return {
    group,
    layout(width) {
      w = width;
      h = w / 1.25;
      box.scale.set(w, h, 0.08);
      brackets.scale.set(w * 1.05, h * 1.05, 1);
      brackets.position.z = 0.05;
      glow.scale.set(w * 1.8, h * 1.8, 1);
      laser.scale.set(w * 1.06, 0.018, 1);
      emitter.scale.set(0.5, 0.5, 1);
      emitter.position.set(0, h * 0.78, 1.3);
    },
    update({ act, vis, time }) {
      fader.apply(vis);
      card.rotation.x = (1 - act) * 0.5 - 0.05;
      card.rotation.y = Math.sin(time * 0.5) * 0.07;
      const y = Math.sin(time * 1.6) * h * 0.38;
      laser.position.set(0, y, 0.07);
      laser.visible = act > 0.05;
      fan.visible = laser.visible;
      fanPos.set([0, h * 0.78, 1.3, -w * 0.53, y, 0.07, w * 0.53, y, 0.07]);
      fanGeo.attributes.position.needsUpdate = true;
      (laser.material as THREE.MeshBasicMaterial).opacity = vis * act;
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
  const screenGeo = ctx.track(new THREE.PlaneGeometry(1, 1, 48, 1));
  const base = Float32Array.from(screenGeo.attributes.position.array as Float32Array);
  const screenMat = fader.add(photoMaterial(ctx, "/experience/journey-of-life.jpg"), 1);
  screenMat.side = THREE.DoubleSide;
  const screen = new THREE.Mesh(screenGeo, screenMat);
  group.add(screen);

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
  const curve = 0.28;
  const bendZ = (x: number) => curve * 4 * x * x;
  return {
    group,
    layout(width) {
      w = width;
      h = w / aspect;
      w *= 0.92;
      h *= 0.92;
      screen.scale.set(w, h, 1);
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
      beamMat.uniforms.uOpacity.value = vis * (0.35 + 0.65 * act);
      const p = screenGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i];
        p[i + 2] = bendZ(x) + Math.sin(x * 9 + time * 1.4) * 0.03 * act;
      }
      screenGeo.attributes.position.needsUpdate = true;
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
/* 5. Smart Living: wireframe house, windows lit by a voice command    */
/* ------------------------------------------------------------------ */
function smartHomeChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();
  const aspect = 1400 / 1140;
  const photo = fader.add(photoMaterial(ctx, "/experience/smarthome.jpg"), 1);
  const panel = framedPanel(ctx, photo, 0xf59e0b, fader);
  group.add(panel.root);

  // house outline: box body + gabled roof (unit size, scaled in layout)
  const v = (x: number, y: number, z: number) => [x, y, z];
  const A = v(-0.5, 0, 0.4), B = v(0.5, 0, 0.4), C = v(0.5, 0, -0.4), D = v(-0.5, 0, -0.4);
  const E = v(-0.5, 0.6, 0.4), F = v(0.5, 0.6, 0.4), G = v(0.5, 0.6, -0.4), H = v(-0.5, 0.6, -0.4);
  const R1 = v(-0.5, 0.95, 0), R2 = v(0.5, 0.95, 0);
  const edges = [A, B, B, C, C, D, D, A, E, F, F, G, G, H, H, E, A, E, B, F, C, G, D, H, E, R1, H, R1, F, R2, G, R2, R1, R2].flat();
  const houseGeo = ctx.track(new THREE.BufferGeometry());
  houseGeo.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  const house = new THREE.Group();
  house.add(new THREE.LineSegments(houseGeo, fader.add(ctx.track(new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 1 })))));
  const floor = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(1.5, 1.3)), fader.add(additive(ctx, 0x22d3ee, 0.08, THREE.DoubleSide)));
  floor.rotation.x = -Math.PI / 2;
  house.add(floor);
  const windows: THREE.Mesh[] = [];
  const winGeo = ctx.track(new THREE.PlaneGeometry(0.2, 0.18));
  [
    [-0.25, 0.3, 0.401, 0],
    [0.25, 0.3, 0.401, 0],
    [0.501, 0.3, 0.15, Math.PI / 2],
    [0.501, 0.3, -0.15, Math.PI / 2],
  ].forEach(([x, y, z, ry]) => {
    const win = new THREE.Mesh(winGeo, additive(ctx, 0xfbbf24, 0.9, THREE.DoubleSide));
    win.position.set(x, y, z);
    win.rotation.y = ry;
    house.add(win);
    windows.push(win);
  });
  group.add(house);

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
      house.scale.setScalar(w * 0.22);
      house.position.set(inner * w * 0.36, -h * 0.5 + 0.02, 0.7);
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
      windows.forEach((win, i) => {
        const on = clamp((cyc - 2.2 - i * 0.35) / 0.3) * clamp((5.6 - cyc) / 0.4);
        (win.material as THREE.MeshBasicMaterial).opacity = (0.12 + 0.88 * on) * vis;
      });
      const mood = clamp((cyc - 3.6) / 0.8) * clamp((5.8 - cyc) / 0.4);
      photo.color.copy(white).lerp(warm, mood * act);
      house.rotation.y = -0.5 + Math.sin(time * 0.4) * 0.25;
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

/** Profile shared by the vase being printed (ch.6) and the finished one (ch.7). */
function vaseRadius(f: number) {
  return 0.22 + 0.11 * Math.sin(f * Math.PI * 1.3 + 0.4) + 0.05 * Math.cos(f * Math.PI * 4);
}

/* ------------------------------------------------------------------ */
/* 6. 3D printing: photo prints layer by layer, vase grows beside it   */
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

  const LAYERS = 40;
  const sliceMat = fader.add(ctx.track(new THREE.MeshMatcapMaterial({ matcap: ctx.matcap, transparent: true, opacity: 1 })));
  const slices = new THREE.InstancedMesh(ctx.track(new THREE.CylinderGeometry(1, 1, 1, 40)), sliceMat, LAYERS);
  const vase = new THREE.Group();
  vase.add(slices);
  const ringMat = fader.add(additive(ctx, 0x67e8f9, 1, THREE.DoubleSide));
  const ring = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(1, 0.03, 8, 64)), ringMat);
  ring.rotation.x = Math.PI / 2;
  const nozzle = new THREE.Mesh(ctx.track(new THREE.ConeGeometry(0.06, 0.16, 16)), fader.add(ctx.track(new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true }))));
  nozzle.rotation.x = Math.PI;
  const plate = new THREE.Mesh(ctx.track(new THREE.BoxGeometry(1.1, 0.04, 1.1)), fader.add(ctx.track(new THREE.MeshBasicMaterial({ color: 0x1e1b4b, transparent: true }))));
  plate.position.y = -0.02;
  vase.add(ring, nozzle, plate);
  group.add(vase);

  const m = new THREE.Matrix4();
  const layerH = 1.3 / LAYERS;
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
      vase.scale.setScalar(w * 0.17);
      vase.position.set(inner * w * 0.42, -h * 0.5 - 0.05, 0.8);
    },
    update({ act, vis, time }) {
      fader.apply(vis);
      // 7 s cycle: print for 5 s, hold, restart; frozen fully printed when out of focus
      const cyc = time % 7;
      const p = act > 0.3 ? clamp(cyc / 5) : 1;
      printMat.uniforms.uProgress.value = p * 1.02;
      printMat.uniforms.uFade.value = vis * (0.35 + 0.65 * act);
      const built = p * LAYERS;
      for (let i = 0; i < LAYERS; i++) {
        const r = vaseRadius(i / (LAYERS - 1));
        const s = clamp(built - i);
        m.makeScale(r * s, layerH * 0.82 * s, r * s);
        m.setPosition(0, (i + 0.5) * layerH, 0);
        slices.setMatrixAt(i, m);
      }
      slices.instanceMatrix.needsUpdate = true;
      const top = Math.min(LAYERS - 1, Math.floor(built));
      const ry = (top + 0.5) * layerH;
      const rr = vaseRadius(top / (LAYERS - 1));
      ring.position.y = ry;
      ring.scale.set(rr * 1.08, rr * 1.08, 1);
      ring.visible = p < 1;
      nozzle.position.set(Math.cos(time * 9) * rr, ry + 0.12, Math.sin(time * 9) * rr);
      nozzle.visible = p < 1;
      vase.rotation.y = time * 0.3;
    },
  };
}

/* ------------------------------------------------------------------ */
/* 7. Keepsake: finished vase on a turntable, souvenir tag, sparks     */
/* ------------------------------------------------------------------ */
function keepsakeChapter(ctx: Ctx): Chapter {
  const group = new THREE.Group();
  const fader = new Fader();

  const profile: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= 32; i++) {
    const f = i / 32;
    profile.push(new THREE.Vector2(vaseRadius(f), f * 1.3));
  }
  profile.push(new THREE.Vector2(vaseRadius(1) - 0.03, 1.3));
  const vaseGeo = ctx.track(new THREE.LatheGeometry(profile, 72));
  // a gentle twist so the matcap shows the print's spiral
  const pos = vaseGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const a = y * 1.1;
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const k = 1 + 0.015 * Math.sin(Math.atan2(z, x) * 8 + y * 6);
    pos.setXYZ(i, (x * Math.cos(a) - z * Math.sin(a)) * k, y, (x * Math.sin(a) + z * Math.cos(a)) * k);
  }
  vaseGeo.computeVertexNormals();
  const vaseMat = fader.add(ctx.track(new THREE.MeshMatcapMaterial({ matcap: ctx.matcap, transparent: true, opacity: 1, side: THREE.DoubleSide })));
  const vase = new THREE.Mesh(vaseGeo, vaseMat);

  const pedestal = new THREE.Mesh(
    ctx.track(new THREE.CylinderGeometry(0.55, 0.62, 0.22, 64)),
    fader.add(ctx.track(new THREE.MeshMatcapMaterial({ matcap: ctx.matcap, color: 0x3b3355, transparent: true, opacity: 1 }))),
  );
  pedestal.position.y = -0.11;
  const rim = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(0.56, 0.012, 8, 96)), fader.add(additive(ctx, 0x67e8f9, 1)));
  rim.rotation.x = Math.PI / 2;
  const orbit = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(0.85, 0.008, 8, 128)), fader.add(additive(ctx, 0xe879f9, 0.8)));
  const orbitNode = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0xf5d0fe, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  orbitNode.scale.set(0.22, 0.22, 1);
  const spot = new THREE.Sprite(
    fader.add(ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: 0x7c3aed, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))),
  );
  spot.scale.set(3.2, 3.2, 1);
  spot.position.set(0, 0.7, -0.5);

  const stand = new THREE.Group();
  stand.add(spot, pedestal, rim, vase, orbit, orbitNode);
  group.add(stand);

  const [c, g] = canvas(900, 560);
  drawSouvenir(g);
  const tag = new THREE.Mesh(
    ctx.track(new THREE.PlaneGeometry(1, 560 / 900)),
    fader.add(ctx.track(new THREE.MeshBasicMaterial({ map: canvasTexture(ctx, c), transparent: true })), 1),
  );
  group.add(tag);

  const SN = ctx.mobile ? 60 : 120;
  const sparkGeo = ctx.track(new THREE.BufferGeometry());
  const sparkPos = new Float32Array(SN * 3);
  const seeds = Array.from({ length: SN }, () => [Math.random(), Math.random() * Math.PI * 2, 0.35 + Math.random() * 0.6]);
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    fader.add(ctx.track(new THREE.PointsMaterial({ size: 0.07, map: ctx.dot, color: 0xf0abfc, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }))),
  );
  stand.add(sparks);

  let w = 4.4;
  return {
    group,
    layout(width) {
      w = width;
      stand.scale.setScalar(w * 0.42);
      stand.position.set(w * 0.2, -w * 0.3, 0.5);
      tag.scale.set(w * 0.62, w * 0.62, 1);
      tag.position.set(-w * 0.22, w * 0.12, -0.35);
      tag.rotation.y = 0.22;
    },
    update({ act, vis, time, dt }) {
      fader.apply(vis);
      vase.rotation.y = time * 0.6;
      vase.position.y = 0.02 + Math.sin(time * 1.2) * 0.03 * act;
      orbit.rotation.set(Math.PI / 2 + 0.35, 0, time * 0.5);
      const a = time * 1.4;
      orbitNode.position.set(Math.cos(a) * 0.85, 0.55 + Math.sin(a) * 0.85 * Math.sin(0.35), Math.sin(a) * 0.85 * Math.cos(0.35));
      orbit.position.y = 0.55;
      for (let i = 0; i < SN; i++) {
        const s = seeds[i];
        s[0] = (s[0] + dt * (0.12 + (i % 5) * 0.02)) % 1;
        const ang = s[1] + time * 0.4;
        sparkPos[i * 3] = Math.cos(ang) * s[2];
        sparkPos[i * 3 + 1] = s[0] * 2.2;
        sparkPos[i * 3 + 2] = Math.sin(ang) * s[2];
      }
      sparkGeo.attributes.position.needsUpdate = true;
      tag.position.y = w * 0.12 + Math.sin(time * 0.7) * 0.05;
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
