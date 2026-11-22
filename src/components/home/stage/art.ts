/**
 * 2D artwork drawn on canvases: used as textures inside the WebGL journey
 * and, unchanged, as plain pictures in the no-WebGL fallback. Fonts are the
 * system sans/mono because a canvas cannot reach next/font's hashed faces.
 */

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrap(g: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return [c, c.getContext("2d")!];
}

/** Soft round sprite for particles and glows. */
export function softDot(): HTMLCanvasElement {
  const [c, g] = canvas(64, 64);
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.35, "rgba(255,255,255,0.45)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return c;
}

/** Iridescent matcap (cyan → violet → magenta) for the printed objects. */
export function matcap(): HTMLCanvasElement {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#07040f";
  g.fillRect(0, 0, 256, 256);
  const base = g.createLinearGradient(30, 30, 226, 226);
  base.addColorStop(0, "#67e8f9");
  base.addColorStop(0.45, "#6d28d9");
  base.addColorStop(0.8, "#c026d3");
  base.addColorStop(1, "#2e1065");
  g.fillStyle = base;
  g.beginPath();
  g.arc(128, 128, 126, 0, Math.PI * 2);
  g.fill();
  const shade = g.createRadialGradient(128, 128, 60, 128, 128, 128);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(5,3,12,0.75)");
  g.fillStyle = shade;
  g.fill();
  const hi = g.createRadialGradient(92, 80, 0, 92, 80, 70);
  hi.addColorStop(0, "rgba(255,255,255,0.95)");
  hi.addColorStop(0.4, "rgba(224,242,254,0.35)");
  hi.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = hi;
  g.fill();
  const rim = g.createRadialGradient(128, 128, 104, 128, 128, 128);
  rim.addColorStop(0, "rgba(232,121,249,0)");
  rim.addColorStop(1, "rgba(232,121,249,0.8)");
  g.fillStyle = rim;
  g.fill();
  return c;
}

/** Chapter 1: sample e-ticket. */
export function drawTicket(g: CanvasRenderingContext2D, W = 800, H = 640) {
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d0a1f");
  bg.addColorStop(1, "#24124a");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(34,211,238,0.55)";
  g.lineWidth = 3;
  roundRect(g, 18, 18, W - 36, H - 36, 22);
  g.stroke();

  g.fillStyle = "#22d3ee";
  g.font = `500 24px ${MONO}`;
  g.fillText("E-TICKET  //  CH.01", 60, 88);
  g.fillStyle = "#ffffff";
  g.font = `800 66px ${SANS}`;
  g.fillText("HOLOLABS", 60, 162);

  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = 21;
  const cell = 11;
  const ox = 60;
  const oy = 228;
  g.fillStyle = "#ffffff";
  roundRect(g, ox - 14, oy - 14, n * cell + 28, n * cell + 28, 10);
  g.fill();
  g.fillStyle = "#0c0814";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const finder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!finder && rnd() > 0.5) g.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  const finder = (fx: number, fy: number) => {
    g.fillStyle = "#0c0814";
    g.fillRect(ox + fx * cell, oy + fy * cell, 7 * cell, 7 * cell);
    g.fillStyle = "#ffffff";
    g.fillRect(ox + (fx + 1) * cell, oy + (fy + 1) * cell, 5 * cell, 5 * cell);
    g.fillStyle = "#0c0814";
    g.fillRect(ox + (fx + 2) * cell, oy + (fy + 2) * cell, 3 * cell, 3 * cell);
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);

  const label = (text: string, x: number, y: number) => {
    g.fillStyle = "#9a90b8";
    g.font = `500 22px ${MONO}`;
    g.fillText(text, x, y);
  };
  const value = (text: string, x: number, y: number, size = 34) => {
    g.fillStyle = "#ffffff";
    g.font = `700 ${size}px ${SANS}`;
    g.fillText(text, x, y);
  };
  label("KODE BOOKING", 380, 262);
  value("HL-2611-X7K2", 380, 308, 40);
  label("TANGGAL", 380, 382);
  label("SHOW", 560, 382);
  value("13 Nov", 380, 424);
  value("18.00", 560, 424);
  g.fillStyle = "rgba(52,211,153,0.16)";
  roundRect(g, 380, 470, 160, 52, 12);
  g.fill();
  g.strokeStyle = "rgba(52,211,153,0.6)";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#34d399";
  g.font = `700 24px ${MONO}`;
  g.fillText("VALID", 422, 505);
}

const HOLO_REPLY =
  "Kurang tidur memang bisa memicu pusing. Aku catat keluhanmu dulu, lalu kusiapkan jadwal konsultasi dengan dokter ya.";

/**
 * Chapter 4: the Holomedis AI assistant screen (a demo, as on hololabs.id).
 * `t` is seconds; it drives the heart rate and the typing reply. The ECG
 * strip is left empty here: in 3D a real line floats in front of it.
 */
export function drawHolomedis(g: CanvasRenderingContext2D, t: number, withEcg = false, W = 1024, H = 768) {
  g.clearRect(0, 0, W, H);
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0716");
  bg.addColorStop(1, "#160b2c");
  g.fillStyle = bg;
  roundRect(g, 0, 0, W, H, 36);
  g.fill();
  g.strokeStyle = "rgba(168,85,247,0.55)";
  g.lineWidth = 3;
  roundRect(g, 2, 2, W - 4, H - 4, 34);
  g.stroke();

  // avatar with heartbeat ring
  const beat = (t * 72) / 60;
  const ph = beat % 1;
  g.strokeStyle = `rgba(232,121,249,${0.6 * (1 - ph)})`;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(116, 116, 56 + ph * 30, 0, Math.PI * 2);
  g.stroke();
  const av = g.createLinearGradient(60, 60, 172, 172);
  av.addColorStop(0, "#e879f9");
  av.addColorStop(1, "#6d28d9");
  g.fillStyle = av;
  g.beginPath();
  g.arc(116, 116, 52, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffffff";
  g.fillRect(112, 92, 8, 48);
  g.fillRect(92, 112, 48, 8);

  g.fillStyle = "#ffffff";
  g.font = `700 42px ${SANS}`;
  g.fillText("Holomedis AI", 196, 108);
  g.fillStyle = "#34d399";
  g.beginPath();
  g.arc(206, 144, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#a79ec0";
  g.font = `400 26px ${SANS}`;
  g.fillText("Asisten dokter · online", 224, 153);

  g.strokeStyle = "rgba(255,255,255,0.18)";
  g.lineWidth = 2;
  roundRect(g, W - 250, 60, 200, 50, 25);
  g.stroke();
  g.fillStyle = "#cfc9dc";
  g.font = `500 22px ${MONO}`;
  g.fillText("SIMULASI DEMO", W - 232, 93);

  // ECG strip
  g.fillStyle = "rgba(34,211,238,0.05)";
  roundRect(g, 56, 200, W - 112, 120, 18);
  g.fill();
  g.strokeStyle = "rgba(34,211,238,0.2)";
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.05)";
  g.lineWidth = 1;
  for (let x = 76; x < W - 56; x += 28) {
    g.beginPath();
    g.moveTo(x, 204);
    g.lineTo(x, 316);
    g.stroke();
  }
  if (withEcg) {
    g.strokeStyle = "#22d3ee";
    g.lineWidth = 4;
    g.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = 56 + (i / 200) * (W - 112);
      const y = 260 - ecg(i / 200 * 3 - t * 1.2) * 48;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }

  // vitals
  const hr = 72 + Math.round(Math.sin(t * 0.6) * 1.4);
  const tiles: [string, string][] = [
    ["Detak jantung", `${hr} bpm`],
    ["SpO₂", "98%"],
    ["Suhu", "36,6°C"],
  ];
  const tw = (W - 112 - 32) / 3;
  tiles.forEach(([k, v], i) => {
    const x = 56 + i * (tw + 16);
    g.fillStyle = "rgba(255,255,255,0.04)";
    roundRect(g, x, 346, tw, 112, 18);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.1)";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#a79ec0";
    g.font = `400 24px ${SANS}`;
    g.fillText(k, x + 22, 388);
    g.fillStyle = "#ffffff";
    g.font = `700 36px ${SANS}`;
    g.fillText(v, x + 22, 434);
  });

  // chat
  g.font = `500 27px ${SANS}`;
  const q = "Dok, aku sering pusing kalau kurang tidur.";
  const qw = g.measureText(q).width + 48;
  g.fillStyle = "#f1ecfb";
  roundRect(g, W - 56 - qw, 486, qw, 64, 20);
  g.fill();
  g.fillStyle = "#170d2a";
  g.fillText(q, W - 56 - qw + 24, 527);

  const cycle = t % 11;
  const shown = Math.floor(Math.min(1, Math.max(0, (cycle - 0.8) / 6)) * HOLO_REPLY.length);
  const lines = wrap(g, HOLO_REPLY, 640);
  let left = shown;
  const visible = lines.map((line) => {
    const part = line.slice(0, Math.max(0, left));
    left -= line.length + 1;
    return part;
  });
  g.fillStyle = "rgba(124,58,237,0.16)";
  roundRect(g, 56, 574, 700, 40 + lines.length * 38, 20);
  g.fill();
  g.strokeStyle = "rgba(168,85,247,0.6)";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#e9e4f5";
  visible.forEach((line, i) => g.fillText(line, 80, 614 + i * 38));
  if (shown < HOLO_REPLY.length && Math.floor(t * 2) % 2 === 0) {
    let li = 0;
    visible.forEach((l, i) => {
      if (l.length > 0) li = i;
    });
    const lx = 80 + g.measureText(visible[li] ?? "").width + 4;
    g.fillRect(lx, 592 + li * 38, 3, 28);
  }
}

/** One heartbeat (P, QRS, T) per unit of x, values roughly -0.3..1. */
export function ecg(x: number): number {
  const p = ((x % 1) + 1) % 1;
  const bump = (c: number, w: number, a: number) => a * Math.exp(-((p - c) ** 2) / (2 * w * w));
  return bump(0.18, 0.025, 0.12) - bump(0.36, 0.008, 0.18) + bump(0.4, 0.012, 1) - bump(0.44, 0.01, 0.3) + bump(0.66, 0.045, 0.26);
}

/** Chapter 7: the souvenir tag that goes home with the 3D print. */
export function drawSouvenir(g: CanvasRenderingContext2D, W = 900, H = 560) {
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0a1d");
  bg.addColorStop(1, "#2a0f3f");
  g.fillStyle = bg;
  roundRect(g, 0, 0, W, H, 28);
  g.fill();
  const edge = g.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, "#22d3ee");
  edge.addColorStop(0.5, "#818cf8");
  edge.addColorStop(1, "#e879f9");
  g.strokeStyle = edge;
  g.lineWidth = 4;
  roundRect(g, 3, 3, W - 6, H - 6, 26);
  g.stroke();

  g.fillStyle = "#22d3ee";
  g.font = `500 24px ${MONO}`;
  g.fillText("SOUVENIR  //  CH.07", 56, 86);
  g.fillStyle = "#cfc9dc";
  g.font = `500 34px ${SANS}`;
  g.fillText("Sampai jumpa lagi di", 56, 168);
  const word = g.createLinearGradient(56, 0, 600, 0);
  word.addColorStop(0, "#ffffff");
  word.addColorStop(1, "#e9d5ff");
  g.fillStyle = word;
  g.font = `800 92px ${SANS}`;
  g.fillText("HOLOLABS", 52, 262);

  g.fillStyle = "#a79ec0";
  g.font = `400 26px ${SANS}`;
  g.fillText("Karya 3D print buatanmu sendiri, siap dibawa pulang.", 56, 330);

  g.strokeStyle = "rgba(255,255,255,0.12)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(56, 384);
  g.lineTo(W - 56, 384);
  g.stroke();

  g.fillStyle = "#9a90b8";
  g.font = `500 22px ${MONO}`;
  g.fillText("JOURNEY", 56, 432);
  g.fillText("DURASI", 300, 432);
  g.fillStyle = "#ffffff";
  g.font = `700 32px ${SANS}`;
  g.fillText("7 / 7 babak", 56, 476);
  g.fillText("± 90 menit", 300, 476);

  let x = W - 260;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = "rgba(255,255,255,0.85)";
  while (x < W - 56) {
    const w = rnd() > 0.6 ? 6 : 3;
    g.fillRect(x, 420, w, 70);
    x += w + 3 + Math.floor(rnd() * 4);
  }
}

/**
 * Backdrop for the journey: deep violet night with a blue glow low on the
 * left and a magenta one high on the right, the palette of the hero photo.
 * Used as scene.background, so it stays fixed while the camera flies.
 */
export function nightSky() {
  const [c, g] = canvas(512, 512);
  const base = g.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, "#0b0722");
  base.addColorStop(0.55, "#060312");
  base.addColorStop(1, "#0a0620");
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  const glow = (x: number, y: number, r: number, color: string) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 512);
  };
  glow(90, 380, 260, "rgba(37,99,235,0.28)");
  glow(430, 110, 240, "rgba(192,38,211,0.22)");
  glow(256, 470, 220, "rgba(124,58,237,0.22)");
  return c;
}

/**
 * One LED wall panel like those lining the hall in the hero photo: a
 * blue → violet → magenta field with ridge lines and a bright horizon arc.
 */
export function ledWall() {
  const [c, g] = canvas(256, 512);
  const bg = g.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, "#1e1b6b");
  bg.addColorStop(0.45, "#4c1d95");
  bg.addColorStop(0.75, "#7e22ce");
  bg.addColorStop(1, "#1d4ed8");
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 512);
  // mountain ridges
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    const base = 250 + k * 46;
    g.moveTo(0, base);
    for (let x = 0; x <= 256; x += 8) {
      const y = base - 60 * Math.abs(Math.sin(x * 0.021 + k * 1.7)) * (1 - k * 0.15) - 18 * Math.sin(x * 0.09 + k);
      g.lineTo(x, y);
    }
    g.lineTo(256, 512);
    g.lineTo(0, 512);
    g.closePath();
    g.fillStyle = `rgba(${20 + k * 10},${10 + k * 6},${60 + k * 20},${0.35 + k * 0.1})`;
    g.fill();
    g.strokeStyle = `rgba(232,121,249,${0.55 - k * 0.1})`;
    g.lineWidth = 1.5;
    g.stroke();
  }
  // horizon arc
  g.strokeStyle = "rgba(103,232,249,0.85)";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(200, 520, 260, 150, 0, Math.PI * 1.05, Math.PI * 1.6);
  g.stroke();
  // LED tile seams
  g.strokeStyle = "rgba(0,0,0,0.25)";
  g.lineWidth = 1;
  for (let y = 0; y < 512; y += 32) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(256, y);
    g.stroke();
  }
  for (let x = 0; x < 256; x += 32) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 512);
    g.stroke();
  }
  // soft edge so panels don't end in a hard line
  const fade = g.createLinearGradient(0, 0, 0, 512);
  fade.addColorStop(0, "rgba(4,2,8,0.85)");
  fade.addColorStop(0.15, "rgba(4,2,8,0)");
  fade.addColorStop(0.9, "rgba(4,2,8,0)");
  fade.addColorStop(1, "rgba(4,2,8,0.7)");
  g.fillStyle = fade;
  g.fillRect(0, 0, 256, 512);
  return c;
}
