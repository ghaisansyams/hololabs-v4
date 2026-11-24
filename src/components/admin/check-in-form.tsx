"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { ScanLine, CheckCircle2, Camera, CameraOff, ImageUp, XCircle } from "lucide-react";
import { checkInByNumber, type CheckInLookupState } from "@/app/admin/actions";
import { Field, TextInput } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const initialState: CheckInLookupState = {};
const BOOKING_NUMBER = /HLM-BOOK-\d{4}-\d+/i;

interface ScanLog {
  id: number;
  ok: boolean;
  text: string;
}

/** Reads a QR out of an ImageData, trying inverted colours too (some screens show it light-on-dark). */
function readQr(img: ImageData): string | null {
  return jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

export function CheckInForm() {
  const [state, formAction, pending] = useActionState(checkInByNumber, initialState);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef({ code: "", at: 0 });
  const busyRef = useRef(false);
  const idRef = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [log, setLog] = useState<ScanLog[]>([]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);

  // the camera only works on HTTPS or localhost; the photo upload works anywhere
  const [cameraOk, setCameraOk] = useState(true);
  useEffect(() => {
    setCameraOk(typeof window !== "undefined" && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  const handleCode = useCallback(async (raw: string) => {
    const number = raw.match(BOOKING_NUMBER)?.[0];
    if (!number) {
      if (lastRef.current.code !== raw || Date.now() - lastRef.current.at > 3000) {
        lastRef.current = { code: raw, at: Date.now() };
        setLog((l) => [{ id: ++idRef.current, ok: false, text: "QR ini bukan e-ticket HOLOLABS." }, ...l].slice(0, 6));
        setFlash("bad");
      }
      return;
    }
    const key = number.toUpperCase();
    // the same code stays in front of the camera for a second or two: handle it once
    if (lastRef.current.code === key && Date.now() - lastRef.current.at < 4000) return;
    if (busyRef.current) return;
    busyRef.current = true;
    lastRef.current = { code: key, at: Date.now() };
    try {
      const fd = new FormData();
      fd.set("bookingNumber", key);
      const res = await checkInByNumber({}, fd);
      const ok = Boolean(res.success);
      setLog((l) => [{ id: ++idRef.current, ok, text: res.success ?? res.error ?? "Gagal check-in." }, ...l].slice(0, 6));
      setFlash(ok ? "ok" : "bad");
      if (navigator.vibrate) navigator.vibrate(ok ? 120 : [80, 60, 80]);
    } catch {
      setLog((l) => [{ id: ++idRef.current, ok: false, text: "Gagal menghubungi server. Coba scan lagi." }, ...l].slice(0, 6));
      setFlash("bad");
    } finally {
      busyRef.current = false;
      lastRef.current.at = Date.now();
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);
  useEffect(() => stop, [stop]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(t);
  }, [flash, log]);

  async function start() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setScanning(true);
      const tick = () => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (v && c && v.readyState >= 2 && v.videoWidth) {
          const scale = Math.min(1, 640 / v.videoWidth);
          c.width = Math.round(v.videoWidth * scale);
          c.height = Math.round(v.videoHeight * scale);
          const g = c.getContext("2d", { willReadFrequently: true });
          if (g) {
            g.drawImage(v, 0, 0, c.width, c.height);
            const code = readQr(g.getImageData(0, 0, c.width, c.height));
            if (code) void handleCode(code);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      stop();
      const name = e instanceof DOMException ? e.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser."
          : name === "NotFoundError"
            ? "Kamera tidak ditemukan di perangkat ini."
            : "Kamera tidak bisa dibuka. Pakai unggah foto QR atau ketik nomor booking.",
      );
    }
  }

  async function fromPhoto(file: File | undefined) {
    if (!file) return;
    setCameraError("");
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      const g = c.getContext("2d", { willReadFrequently: true });
      if (!g) return;
      g.drawImage(bmp, 0, 0, c.width, c.height);
      const code = readQr(g.getImageData(0, 0, c.width, c.height));
      if (code) {
        lastRef.current = { code: "", at: 0 };
        await handleCode(code);
      } else {
        setLog((l) => [{ id: ++idRef.current, ok: false, text: "QR tidak terbaca di foto itu. Coba foto lebih dekat dan terang." }, ...l].slice(0, 6));
        setFlash("bad");
      }
    } catch {
      setCameraError("Foto tidak bisa dibaca.");
    }
  }

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    void fromPhoto(e.target.files?.[0]);
    e.target.value = "";
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* left: the camera */}
      <section className="space-y-4 rounded-card border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Scan QR e-ticket</h2>
            <p className="mt-0.5 text-xs text-muted">{scanning ? "Arahkan QR ke kotak. Check-in tercatat otomatis begitu terbaca." : "Kamera membaca QR di e-ticket pengunjung."}</p>
          </div>
          {scanning ? (
            <button type="button" onClick={stop} className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-accent/50 hover:text-ink">
              <CameraOff className="size-3.5" aria-hidden />
              Matikan kamera
            </button>
          ) : null}
        </div>

        <div className={cn("relative aspect-square w-full overflow-hidden rounded-2xl border bg-[#07050f] transition-colors sm:aspect-[4/3]", flash === "ok" ? "border-success" : flash === "bad" ? "border-danger" : "border-line")}>
          <video ref={videoRef} playsInline muted className={cn("size-full object-cover", !scanning && "hidden")} />
          {/* viewfinder corners, shown with and without the camera */}
          <div aria-hidden className={cn("pointer-events-none absolute inset-[8%] rounded-2xl sm:inset-[16%]", scanning && "shadow-[0_0_0_999px_rgba(0,0,0,0.38)]")}>
            <span className="absolute left-0 top-0 size-8 rounded-tl-2xl border-l-2 border-t-2 border-white/70" />
            <span className="absolute right-0 top-0 size-8 rounded-tr-2xl border-r-2 border-t-2 border-white/70" />
            <span className="absolute bottom-0 left-0 size-8 rounded-bl-2xl border-b-2 border-l-2 border-white/70" />
            <span className="absolute bottom-0 right-0 size-8 rounded-br-2xl border-b-2 border-r-2 border-white/70" />
          </div>

          {!scanning ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full border border-line bg-surface-raised text-ink-soft">
                {cameraOk ? <Camera className="size-6" aria-hidden /> : <CameraOff className="size-6" aria-hidden />}
              </span>
              {cameraOk ? (
                <>
                  <p className="max-w-xs text-sm text-ink-soft">Izinkan akses kamera untuk mulai memindai.</p>
                  <button
                    type="button"
                    onClick={start}
                    className="inline-flex items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-brand to-accent px-6 py-3 text-sm font-bold text-canvas transition hover:opacity-90"
                  >
                    <Camera className="size-4" aria-hidden />
                    Izinkan & buka kamera
                  </button>
                </>
              ) : (
                <>
                  <p className="max-w-sm text-sm text-ink-soft">Kamera langsung hanya aktif di HTTPS (domain asli) atau localhost. Di sini, foto QR-nya saja.</p>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-brand to-accent px-6 py-3 text-sm font-bold text-canvas transition hover:opacity-90 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
                    <ImageUp className="size-4" aria-hidden />
                    Foto / unggah QR
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pickPhoto} />
                  </label>
                </>
              )}
            </div>
          ) : null}

          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300",
              flash ? "opacity-100" : "opacity-0",
              flash === "ok" ? "bg-success/35" : "bg-danger/35",
            )}
          >
            {flash === "ok" ? <CheckCircle2 className="size-20" /> : <XCircle className="size-20" />}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {cameraOk ? (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-accent/50 hover:text-ink focus-within:border-accent">
            <ImageUp className="size-4" aria-hidden />
            Atau foto / unggah gambar QR
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pickPhoto} />
          </label>
        ) : null}
        {cameraError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {cameraError}
          </p>
        ) : null}
      </section>

      {/* right: manual entry and the scan log */}
      <div className="space-y-5">
        <form action={formAction} className="space-y-4 rounded-card border border-line bg-surface p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-bold text-ink">Ketik nomor booking</h2>
            <p className="mt-0.5 text-xs text-muted">Kalau QR tidak terbaca, masukkan nomor di e-ticket.</p>
          </div>
          <Field label="Nomor booking" htmlFor="bookingNumber" required>
            <TextInput id="bookingNumber" name="bookingNumber" placeholder="HLM-BOOK-2026-00001" autoComplete="off" />
          </Field>
          {state.error ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            <ScanLine className="size-4" aria-hidden />
            {pending ? "Memproses…" : "Check-in"}
          </Button>
          {state.success ? (
            <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-success-soft px-4 py-3 text-sm text-ink">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
              {state.success}
            </div>
          ) : null}
        </form>

        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-bold text-ink">Hasil scan</h2>
          {log.length ? (
            <ul aria-live="polite" className="mt-3 space-y-1.5">
              {log.map((l) => (
                <li
                  key={l.id}
                  className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-sm", l.ok ? "border-success/40 bg-success-soft text-ink" : "border-danger/40 bg-danger-soft text-ink")}
                >
                  {l.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />}
                  {l.text}
                </li>
              ))}
            </ul>
          ) : (
            <p aria-live="polite" className="mt-2 text-sm text-muted">Belum ada scan. Hasil tiap scan muncul di sini.</p>
          )}
        </section>
      </div>
    </div>
  );
}
