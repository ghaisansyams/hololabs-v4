/**
 * Posisi scroll global, di luar state React.
 *
 * Kamera 3D membacanya 60 kali per detik. Menaruhnya di state React akan
 * memicu render ulang tiap frame dan menjatuhkan frame rate, jadi nilainya
 * disimpan di objek biasa yang dimutasi.
 */
export const scrollState = {
  /** 0 di paling atas, 1 di paling bawah halaman. */
  progress: 0,
  /** Piksel per frame, dipakai untuk efek yang bereaksi ke kecepatan scroll. */
  velocity: 0,
  /** Tinggi viewport, disimpan supaya scene tidak menghitung ulang. */
  viewport: 1,
};

/** Posisi tiap scene di halaman, diisi saat section dipasang. */
export const sceneOffsets = new Map<string, { start: number; end: number }>();

export function registerScene(key: string, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const top = rect.top + window.scrollY;
  sceneOffsets.set(key, { start: top, end: top + rect.height });
}

/**
 * Berapa jauh pengunjung berada di dalam satu scene: 0 saat baru masuk layar,
 * 1 saat baru keluar. Dipakai scene 3D untuk menganimasikan dirinya sendiri.
 */
export function sceneProgress(key: string): number {
  const bounds = sceneOffsets.get(key);
  if (!bounds) return 0;
  const y = scrollState.progress * maxScroll();
  const span = bounds.end - bounds.start + scrollState.viewport;
  if (span <= 0) return 0;
  const local = (y + scrollState.viewport - bounds.start) / span;
  return Math.min(1, Math.max(0, local));
}

export function maxScroll(): number {
  if (typeof document === "undefined") return 1;
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

/**
 * Pada progres berapa sebuah scene berada tepat di tengah layar.
 *
 * Dipakai untuk menempatkan objek 3D. Versi sebelumnya menaruh objek pada
 * jarak yang sama rata di sepanjang koridor, seolah tiap section setinggi
 * section lainnya. Padahal scene Solutions jauh lebih tinggi daripada scene
 * Colors, sehingga objek dan teksnya melenceng makin jauh ke bawah halaman —
 * sistem orbit bahkan tidak pernah sampai ke layar. Mengambil posisi nyata
 * section dari DOM membuat keduanya selalu bertemu.
 */
export function sceneCenterProgress(key: string): number {
  const bounds = sceneOffsets.get(key);
  if (!bounds) return 0;
  const center = (bounds.start + bounds.end) / 2 - scrollState.viewport / 2;
  return Math.min(1, Math.max(0, center / maxScroll()));
}
