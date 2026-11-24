import * as THREE from "three";
import { matcap, softDot } from "./art";

/** The single background colour of the journey (also used by the page around the canvas). */
export const BACKDROP = 0x0a0618;
import { chapterFactories, type Chapter, type Ctx } from "./chapters";

const SPACING = 11;
const FIRST_Z = -14;
const VIEW_DIST = 8.5;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/** 1 while the camera rests at a stop, fading to 0 as it travels away. */
const restOpacity = (distance: number) => clamp(1 - (distance - 0.12) / 0.2);

/**
 * The chapters are stacked vertically and the camera descends through them as
 * the page scrolls down: each chapter sits at its own height, all at the same
 * depth, and the camera rests in front of one at a time.
 */
const FOCUS_Z = FIRST_Z;
const CAM_Z = FOCUS_Z + VIEW_DIST;
const chapterY = (index: number) => -index * SPACING;

/** Camera height for a scroll position t in [0, stops-1], dwelling at each stop. */
function cameraY(t: number, stops: number) {
  if (stops < 2) return chapterY(0);
  const s = Math.min(stops - 2, Math.floor(t));
  const u = smooth(clamp((t - s - 0.18) / 0.64));
  return chapterY(s) + (chapterY(s + 1) - chapterY(s)) * u;
}

export interface StageOptions {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  section: HTMLElement;
  count: number;
  /** CMS image per chapter ("" = use the built-in one). */
  images?: string[];
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
  scene.fog = new THREE.FogExp2(BACKDROP, 0.016);
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
  // crop a texture to fill a panel of the given aspect, whatever shape the image is
  const cover = (t: THREE.Texture) => {
    const aspect = t.userData.cover as number | undefined;
    const img = t.image as { width?: number; height?: number } | undefined;
    if (!aspect || !img?.width || !img?.height) return;
    const ia = img.width / img.height;
    t.repeat.set(Math.min(1, aspect / ia), Math.min(1, ia / aspect));
    t.offset.set((1 - t.repeat.x) / 2, (1 - t.repeat.y) / 2);
  };
  const tex = (src: string, aspect?: number) => {
    const hit = cache.get(src);
    if (hit) {
      if (aspect) {
        hit.userData.cover = aspect;
        cover(hit);
      }
      return hit;
    }
    const t = track(
      loader.load(
        src,
        (loadedTex) => {
          loaded += 1;
          cover(loadedTex);
          if (loaded >= 2) fireReady();
        },
        undefined,
        () => fireReady(),
      ),
    );
    if (aspect) t.userData.cover = aspect;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    cache.set(src, t);
    return t;
  };
  const dot = track(new THREE.CanvasTexture(softDot()));
  const cap = track(new THREE.CanvasTexture(matcap()));
  cap.colorSpace = THREE.SRGBColorSpace;
  const ctx: Ctx = { track, tex, image: (fallback) => fallback, dot, matcap: cap, mobile };

  // ---- backdrop: one plain colour, nothing else behind the chapters ----
  scene.background = new THREE.Color(BACKDROP);

  // ---- chapters --------------------------------------------------------
  const chapters: (Chapter & { side: number })[] = [];
  for (let i = 0; i < o.count; i++) {
    const chapterCtx: Ctx = { ...ctx, image: (fallback) => o.images?.[i] || fallback };
    const ch = chapterFactories[i % chapterFactories.length](chapterCtx);
    scene.add(ch.group);
    // every chapter sits on the right; its text is on the left
    chapters.push({ ...ch, side: 1 });
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
    const stops = chapters.length;
    const p = clamp(-rect.top / Math.max(1, rect.height - vh));
    smoothT += (p * (stops - 1) - smoothT) * (1 - Math.exp(-dt * 5));
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 4));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 4));

    const camY = cameraY(smoothT, stops);
    // lean the view in the direction of travel while the page is moving
    const lean = clamp((p * (stops - 1) - smoothT) * 0.5, -1, 1);
    camera.position.set(ptr.x * 0.55, camY - ptr.y * 0.3, CAM_Z);
    camera.lookAt(ptr.x * 0.15, camY - ptr.y * 0.08 + lean * 0.9, CAM_Z - 10);

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      // d: 0 when the camera rests at this chapter, +1 one chapter past it (it left upward), -1 one chapter before
      const d = (camY - chapterY(i)) / SPACING;
      const vis = clamp(1 - (Math.abs(d) - 0.3) / 0.45);
      ch.group.visible = vis > 0.01;
      if (!ch.group.visible) continue;
      const act = clamp(1 - Math.abs(d) / 0.8);
      const x = portrait ? 0 : ch.side * 3.0;
      const y = portrait ? 1.8 : 0.15;
      ch.group.position.set(x, chapterY(i) + y + Math.sin(time * 0.6 + i) * 0.06, FOCUS_Z + act * 0.6 - Math.abs(d) * 2.2);
      // tilts back as it leaves or approaches, so the stack reads as a 3D column
      ch.group.rotation.x = clamp(d, -1, 1) * 0.35;
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
      o.onActive(Math.min(rounded, stops - 1));
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
