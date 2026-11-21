import * as THREE from "three";
import { matcap, softDot } from "./art";
import { chapterFactories, type Chapter, type Ctx } from "./chapters";
import { createPortal } from "./portal";

export const STOPS = 8; // hero + 7 chapters
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

export interface StageOptions {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  section: HTMLElement;
  count: number;
  onReady: () => void;
  onActive: (index: number) => void;
  onError: (error: unknown) => void;
}

/**
 * Builds the scene, drives the camera from the page scroll, and writes the
 * overlay state (`--o`, `--t`) to CSS variables so React never re-renders
 * per frame. Returns a disposer.
 */
export function createStage(o: StageOptions): () => void {
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: !mobile, powerPreference: "high-performance" });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x040208, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040208, 0.016);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 160);

  const disposables: { dispose: () => void }[] = [];
  const track = <D extends { dispose: () => void }>(d: D): D => {
    disposables.push(d);
    return d;
  };

  let loaded = 0;
  let readyFired = false;
  const fireReady = () => {
    if (!readyFired) {
      readyFired = true;
      o.onReady();
    }
  };
  const readyTimer = window.setTimeout(fireReady, 2500);
  const loader = new THREE.TextureLoader();
  const cache = new Map<string, THREE.Texture>();
  const tex = (src: string) => {
    const hit = cache.get(src);
    if (hit) return hit;
    const t = track(
      loader.load(
        src,
        () => {
          loaded += 1;
          if (loaded >= 2) fireReady();
        },
        undefined,
        () => fireReady(),
      ),
    );
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    cache.set(src, t);
    return t;
  };
  const dot = track(new THREE.CanvasTexture(softDot()));
  const cap = track(new THREE.CanvasTexture(matcap()));
  cap.colorSpace = THREE.SRGBColorSpace;
  const ctx: Ctx = { track, tex, dot, matcap: cap, mobile };

  // ---- ambient: star field + floor runway -------------------------------
  const starCount = mobile ? 700 : 1600;
  const pos = new Float32Array(starCount * 3);
  const col = new Float32Array(starCount * 3);
  const palette = [new THREE.Color(0x67e8f9), new THREE.Color(0x818cf8), new THREE.Color(0xf0abfc), new THREE.Color(0xffffff)];
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
  scene.add(
    new THREE.Points(
      starGeo,
      track(new THREE.PointsMaterial({ size: 0.14, map: dot, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })),
    ),
  );

  const runwayCount = 240;
  const rp = new Float32Array(runwayCount * 3);
  for (let i = 0; i < runwayCount; i++) {
    rp[i * 3] = (i % 2 === 0 ? -1 : 1) * 2.4;
    rp[i * 3 + 1] = -3.4;
    rp[i * 3 + 2] = -2 - (i / runwayCount) * 88;
  }
  const runwayGeo = track(new THREE.BufferGeometry());
  runwayGeo.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const runwayMat = track(
    new THREE.PointsMaterial({ size: 0.2, map: dot, color: 0x67e8f9, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  scene.add(new THREE.Points(runwayGeo, runwayMat));

  // ---- hero portal + chapters -------------------------------------------
  const portal = createPortal(ctx, pixelRatio);
  scene.add(portal.group);

  const chapters: (Chapter & { side: number })[] = [];
  for (let i = 0; i < o.count; i++) {
    const ch = chapterFactories[i % chapterFactories.length](ctx);
    scene.add(ch.group);
    chapters.push({ ...ch, side: i % 2 === 0 ? -1 : 1 });
  }

  let portrait = false;
  const layout = () => {
    const w = o.stage.clientWidth;
    const h = o.stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    portrait = camera.aspect < 0.95;
    camera.fov = portrait ? 62 : 48;
    camera.updateProjectionMatrix();
    portal.layout(portrait);
    for (const ch of chapters) ch.layout(portrait ? 3.5 : 4.4, portrait ? 0 : ch.side);
  };
  layout();

  // ---- input -------------------------------------------------------------
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  const ro = new ResizeObserver(layout);
  ro.observe(o.stage);
  let visible = true;
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  });
  io.observe(o.section);

  // ---- loop --------------------------------------------------------------
  let smoothT = 0;
  let last = performance.now();
  const t0 = last;
  let lastActive = -1;
  let frame = 0;

  const step = (now: number) => {
    if (!visible) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = (now - t0) / 1000;

    const rect = o.section.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp(-rect.top / Math.max(1, rect.height - vh));
    smoothT += (p * (STOPS - 1) - smoothT) * (1 - Math.exp(-dt * 5));
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));

    const camZ = cameraZ(smoothT);
    camera.position.set(ptr.x * 0.55, -ptr.y * 0.3, camZ);
    camera.lookAt(ptr.x * 0.15, -ptr.y * 0.08, camZ - 10);

    portal.update(time, clamp((camZ - 1.5) / 5), ptr.x, ptr.y);

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const focus = FIRST_Z - i * SPACING;
      const dist = camZ - focus;
      const vis = clamp((20 - dist) / 8) * (dist > -2 ? 1 : 0);
      ch.group.visible = vis > 0.01;
      if (!ch.group.visible) continue;
      const act = clamp(1 - Math.abs(dist - VIEW_DIST) / 9);
      const x = portrait ? 0 : ch.side * 3.0;
      const y = portrait ? 1.8 : 0.15;
      ch.group.position.set(x, y + Math.sin(time * 0.6 + i) * 0.06, focus + act * 0.6);
      ch.group.rotation.y = portrait ? 0 : -ch.side * (0.24 - 0.1 * act);
      ch.group.scale.setScalar(0.94 + 0.08 * act);
      ch.update({ act, vis, time, dt });
    }

    renderer.render(scene, camera);

    const rounded = Math.round(smoothT);
    o.stage.style.setProperty("--o", restOpacity(Math.abs(smoothT - rounded)).toFixed(3));
    o.stage.style.setProperty("--t", smoothT.toFixed(3));
    if (rounded !== lastActive) {
      lastActive = rounded;
      o.onActive(Math.min(rounded, o.count));
    }
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    try {
      step(now);
    } catch (error) {
      cancelAnimationFrame(frame);
      o.onError(error);
    }
  };
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(readyTimer);
    window.removeEventListener("pointermove", onPointer);
    ro.disconnect();
    io.disconnect();
    for (const d of disposables) d.dispose();
    renderer.dispose();
  };
}
