"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Stethoscope, Ticket, type LucideIcon } from "lucide-react";

/**
 * Hero backdrop in the manner of polygon.technology: two fans of thin curved
 * lines rise from below the fold and bow out around the headline, light
 * comets run up them, and small chips naming parts of the show ride on the
 * lines. Canvas 2D for the lines (cheap, crisp), HTML for the chips so their
 * text and thumbnails stay sharp. Pauses off screen; static under reduced
 * motion.
 */

type Chip = {
  label: string;
  img?: string;
  Icon?: LucideIcon;
  side: 1 | -1;
  line: number;
  t: number;
  mobile?: boolean;
};

// stepped so the chips never overlap: inner line low, outer line higher up
const CHIPS: Chip[] = [
  { label: "Video Mapping", img: "/experience/journey-of-life.jpg", side: 1, line: 2, t: 0.47 },
  { label: "DJ Live", img: "/experience/dj.jpg", side: 1, line: 1, t: 0.36, mobile: true },
  { label: "3D Printing", img: "/experience/print3d.jpg", side: 1, line: 0, t: 0.22 },
  { label: "E-Ticket QR", Icon: Ticket, side: -1, line: 2, t: 0.47 },
  { label: "AI Doctor", Icon: Stethoscope, side: -1, line: 1, t: 0.36 },
  { label: "Smart Home", img: "/experience/smarthome.jpg", side: -1, line: 0, t: 0.22, mobile: true },
];

const LINES = 11;

type Pt = { x: number; y: number };

function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

export function HeroPattern() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // control points of line k on one side; `breath` makes the fan swell slowly
    const ctrl = (k: number, s: number, time: number, px: number) => {
      const cx = w / 2 + px * 14;
      const spread = (mobile ? 0.55 : 1) * (1 + 0.025 * Math.sin(time * 0.35 + k * 0.5));
      const base = mobile ? 0.62 : 1;
      return [
        { x: cx + s * w * 0.008 * k, y: h * 1.06 },
        { x: cx + s * w * (0.2 + 0.03 * k) * spread * base, y: h * 0.92 },
        { x: cx + s * w * (0.52 + 0.045 * k) * spread * base, y: h * 0.32 },
        { x: cx + s * w * (0.32 + 0.06 * k) * base, y: -h * 0.12 },
      ] as const;
    };

    const comets = Array.from({ length: mobile ? 8 : 16 }, (_, i) => ({
      s: i % 2 === 0 ? 1 : -1,
      k: Math.floor(Math.random() * (LINES - 2)),
      t: Math.random(),
      v: 0.05 + Math.random() * 0.07,
      hue: [0x67e8f9, 0xc084fc, 0xf0abfc][i % 3],
    }));
    const rgba = (hex: number, a: number) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;

    const pointer = { x: 0, tx: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(frame);
    });
    io.observe(host);

    let last = performance.now();
    let time = 0;
    function frame(now: number) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) time += dt;
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
      if (!ctx || !fade) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // the fans of lines
      ctx.lineWidth = 1;
      for (const s of [1, -1]) {
        for (let k = 0; k < LINES; k++) {
          const [p0, p1, p2, p3] = ctrl(k, s, time, pointer.x);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
          const cyan = k % 4 === 2;
          ctx.strokeStyle = cyan ? "rgba(103,232,249,0.32)" : `rgba(139,92,246,${0.5 - k * 0.025})`;
          ctx.stroke();
        }
      }
      // fade the lines out towards the top so the header stays clean
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // comets running up the lines
      for (const c of comets) {
        c.t += c.v * dt;
        if (c.t > 1) {
          c.t = 0;
          c.k = Math.floor(Math.random() * (LINES - 2));
        }
        const [p0, p1, p2, p3] = ctrl(c.k, c.s, time, pointer.x);
        const life = Math.sin(Math.PI * Math.min(1, c.t * 1.15));
        for (let i = 0; i < 14; i++) {
          const tt = c.t - i * 0.006;
          if (tt < 0) break;
          const q = bezier(p0, p1, p2, p3, tt);
          ctx.fillStyle = rgba(c.hue, life * (1 - i / 14) * 0.55);
          ctx.beginPath();
          ctx.arc(q.x, q.y, i === 0 ? 2.2 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        const head = bezier(p0, p1, p2, p3, c.t);
        const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
        g.addColorStop(0, rgba(c.hue, 0.7 * life));
        g.addColorStop(1, rgba(c.hue, 0));
        ctx.fillStyle = g;
        ctx.fillRect(head.x - 14, head.y - 14, 28, 28);
      }

      // chips ride their lines; a glowing node marks where each one sits
      CHIPS.forEach((chip, i) => {
        const el = chipRefs.current[i];
        if (!el) return;
        const show = !mobile || chip.mobile;
        el.style.display = show ? "" : "none";
        if (!show) return;
        const [p0, p1, p2, p3] = ctrl(chip.line, chip.side, time, pointer.x);
        const t = chip.t + 0.025 * Math.sin(time * 0.45 + i * 1.3);
        const q = bezier(p0, p1, p2, p3, mobile ? t * 0.7 : t);
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 10);
        g.addColorStop(0, "rgba(240,171,252,0.95)");
        g.addColorStop(1, "rgba(240,171,252,0)");
        ctx.fillStyle = g;
        ctx.fillRect(q.x - 10, q.y - 10, 20, 20);
        // keep the chip inside the hero and above the fade at its foot
        const cw = el.offsetWidth;
        const x = chip.side > 0 ? Math.min(q.x + 10, w - cw - 12) : Math.max(q.x - 10 - cw, 12);
        const y = Math.min(q.y - 15, h - (mobile ? 120 : 90));
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
      ctx.globalCompositeOperation = "source-over";

      if (visible && !reduced) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const onResizeRedraw = () => {
      if (reduced) requestAnimationFrame(frame);
    };
    window.addEventListener("resize", onResizeRedraw);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResizeRedraw);
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      {CHIPS.map((chip, i) => (
        <div
          key={chip.label}
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 will-change-transform"
        >
          <div
            className="hero-chip flex items-center gap-2 rounded-md bg-white/95 py-1 pl-1 pr-2.5 shadow-[0_6px_24px_rgb(124_58_237/0.35)]"
            style={{ animationDelay: `${400 + i * 120}ms` }}
          >
            {chip.img ? (
              <Image src={chip.img} alt="" width={44} height={44} className="size-[1.375rem] rounded-[0.3rem] object-cover" />
            ) : chip.Icon ? (
              <span className="flex size-[1.375rem] items-center justify-center rounded-[0.3rem] bg-gradient-to-br from-[#22d3ee] to-[#8b5cf6] text-white">
                <chip.Icon className="size-3.5" strokeWidth={2.4} />
              </span>
            ) : null}
            <span className="whitespace-nowrap font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#4b4468]">{chip.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
