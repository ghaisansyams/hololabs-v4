"use client";

import { useEffect, useRef } from "react";

/**
 * Hero backdrop in the manner of polygon.technology: two fans of thin curved
 * lines rise from a glowing portal below the headline and bow out around it.
 * On top of the lines:
 *  - an energy wave rolls up every fan every few seconds, line after line;
 *  - light comets run up single lines;
 *  - the portal sends out rippling rings and a slowly turning dashed orbit;
 *  - near the cursor the lines light up (desktop);
 *  - scrolling away opens the fan wider, as if stepping through it.
 * Canvas 2D, paused off screen, one still frame under reduced motion.
 */

const LINES = 11;
const SAMPLES = 44;

type Pt = { x: number; y: number };

function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

const rgba = (hex: number, a: number) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a.toFixed(3)})`;

export function HeroPattern() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let w = 1;
    let h = 1;
    let dpr = 1;
    let mobile = false;
    let fade: CanvasGradient | null = null;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth || 1;
      h = host.clientHeight || 1;
      mobile = w < 640;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      fade = ctx.createLinearGradient(0, 0, 0, h);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(0.35, "rgba(0,0,0,0.55)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      if (reduced) requestAnimationFrame(frame);
    };

    // every line as a polyline, rebuilt each frame (22 lines x 44 points)
    const paths: { s: number; k: number; pts: Pt[] }[] = [];
    for (const s of [1, -1]) for (let k = 0; k < LINES; k++) paths.push({ s, k, pts: Array.from({ length: SAMPLES + 1 }, () => ({ x: 0, y: 0 })) });
    const PORTAL_Y = 0.91;
    const build = (time: number, px: number, open: number) => {
      const cx = w / 2 + px * 14;
      const base = mobile ? 0.62 : 1;
      for (const path of paths) {
        const { s, k } = path;
        const spread = (mobile ? 0.55 : 1) * (1 + 0.025 * Math.sin(time * 0.35 + k * 0.5)) * (1 + 0.45 * open);
        const p0 = { x: cx + s * w * 0.008 * k, y: h * 1.06 };
        const p1 = { x: cx + s * w * (0.2 + 0.03 * k) * spread * base, y: h * 0.92 };
        const p2 = { x: cx + s * w * (0.52 + 0.045 * k) * spread * base, y: h * 0.32 };
        const p3 = { x: cx + s * w * (0.32 + 0.06 * k) * base * (1 + 0.3 * open), y: -h * 0.12 };
        for (let i = 0; i <= SAMPLES; i++) {
          const q = bezier(p0, p1, p2, p3, i / SAMPLES);
          path.pts[i].x = q.x;
          path.pts[i].y = q.y;
        }
      }
    };
    const at = (pts: Pt[], t: number): Pt => {
      const f = Math.min(SAMPLES - 1e-6, Math.max(0, t * SAMPLES));
      const i = Math.floor(f);
      const r = f - i;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * r, y: pts[i].y + (pts[i + 1].y - pts[i].y) * r };
    };
    const strokePath = (pts: Pt[]) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i <= SAMPLES; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    };

    const comets = Array.from({ length: 16 }, (_, i) => ({
      path: Math.floor(Math.random() * paths.length),
      t: Math.random(),
      v: 0.05 + Math.random() * 0.07,
      hue: [0x67e8f9, 0xc084fc, 0xf0abfc][i % 3],
    }));

    const pointer = { x: 0, tx: 0, px: -999, py: -999, on: 0, ton: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      const r = host.getBoundingClientRect();
      pointer.px = e.clientX - r.left;
      pointer.py = e.clientY - r.top;
      pointer.ton = pointer.py > 0 && pointer.py < r.height ? 1 : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let scrollOpen = 0;
    const onScroll = () => {
      scrollOpen = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight || 1)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    let visible = true;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(frame);
    });

    let last = performance.now();
    let time = reduced ? 2.2 : 0;
    function frame(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) time += dt;
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
      pointer.on += (pointer.ton - pointer.on) * Math.min(1, dt * 4);
      if (!ctx || !fade) return;
      build(time, pointer.x, reduced ? 0 : scrollOpen);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);

      // 1. the fans of lines
      ctx.lineWidth = 1;
      for (const { k, pts } of paths) {
        ctx.strokeStyle = k % 4 === 2 ? "rgba(103,232,249,0.32)" : `rgba(139,92,246,${0.5 - k * 0.025})`;
        strokePath(pts);
      }

      // 2. energy wave rolling up the fans, one line a moment after the next
      const PERIOD = 4.2;
      const wave = (time % PERIOD) / 2.4;
      if (wave < 1.35) {
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        for (const { k, pts } of paths) {
          const head = wave - k * 0.03;
          if (head <= 0 || head > 1.12) continue;
          for (let i = 0; i < SAMPLES; i++) {
            const t = i / SAMPLES;
            const d = head - t;
            if (d < 0 || d > 0.16) continue;
            const a = (1 - d / 0.16) * 0.9;
            ctx.strokeStyle = k % 4 === 2 ? rgba(0xa5f3fc, a) : rgba(0xd8b4fe, a);
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
            ctx.stroke();
          }
        }
      }

      // fade everything drawn so far towards the top so the header stays clean
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // 3. lines light up around the cursor
      if (finePointer && !mobile && pointer.on > 0.01) {
        const R = 190;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pointer.px, pointer.py, R, 0, Math.PI * 2);
        ctx.clip();
        const spot = ctx.createRadialGradient(pointer.px, pointer.py, 0, pointer.px, pointer.py, R);
        spot.addColorStop(0, `rgba(216,180,254,${0.75 * pointer.on})`);
        spot.addColorStop(1, "rgba(216,180,254,0)");
        ctx.strokeStyle = spot;
        ctx.lineWidth = 1.4;
        for (const { pts } of paths) strokePath(pts);
        const glow = ctx.createRadialGradient(pointer.px, pointer.py, 0, pointer.px, pointer.py, R);
        glow.addColorStop(0, `rgba(124,58,237,${0.12 * pointer.on})`);
        glow.addColorStop(1, "rgba(124,58,237,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(pointer.px - R, pointer.py - R, R * 2, R * 2);
        ctx.restore();
      }

      // 4. comets running up single lines
      for (const c of comets) {
        if (!reduced) c.t += c.v * dt;
        if (c.t > 1) {
          c.t = 0;
          c.path = Math.floor(Math.random() * paths.length);
        }
        const { pts, k } = paths[c.path];
        if (k > LINES - 3) continue;
        const life = Math.sin(Math.PI * Math.min(1, c.t * 1.15));
        for (let i = 0; i < 14; i++) {
          const tt = c.t - i * 0.006;
          if (tt < 0) break;
          const q = at(pts, tt);
          ctx.fillStyle = rgba(c.hue, life * (1 - i / 14) * 0.55);
          ctx.beginPath();
          ctx.arc(q.x, q.y, i === 0 ? 2.2 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        const head = at(pts, c.t);
        const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
        g.addColorStop(0, rgba(c.hue, 0.7 * life));
        g.addColorStop(1, rgba(c.hue, 0));
        ctx.fillStyle = g;
        ctx.fillRect(head.x - 14, head.y - 14, 28, 28);
      }

      // 5. the portal the lines rise from: core glow, ripples, a turning dashed orbit
      const cx = w / 2 + pointer.x * 14;
      const py = h * PORTAL_Y;
      const RX = (mobile ? 0.3 : 0.14) * w;
      const core = ctx.createRadialGradient(cx, py, 0, cx, py, RX * 1.3);
      core.addColorStop(0, "rgba(196,181,253,0.35)");
      core.addColorStop(0.4, "rgba(124,58,237,0.18)");
      core.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = core;
      ctx.save();
      ctx.translate(cx, py);
      ctx.scale(1, 0.32);
      ctx.fillRect(-RX * 1.3, -RX * 1.3, RX * 2.6, RX * 2.6);
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        const ph = (time * 0.32 + i / 3) % 1;
        const rx = RX * (0.35 + 1.4 * ph);
        ctx.strokeStyle = rgba(i === 1 ? 0x67e8f9 : 0xa78bfa, (1 - ph) * 0.55);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, py, rx, rx * 0.17, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([5, 9]);
      ctx.lineDashOffset = -time * 24;
      ctx.strokeStyle = "rgba(103,232,249,0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, py, RX * 0.8, RX * 0.8 * 0.17, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = "source-over";

      if (visible && !reduced) raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    io.observe(host);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
