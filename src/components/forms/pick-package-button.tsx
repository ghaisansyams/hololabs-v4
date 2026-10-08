"use client";

/** Nama event yang didengar BookingForm untuk memilih paket dari luar form. */
export const PICK_PACKAGE_EVENT = "holo:pick-package";

/**
 * Tombol "Pilih {paket}" di kartu paket. Tetap tautan biasa ke #pesan —
 * scroll-nya ditangani Lenis seperti anchor lain, dan tanpa JavaScript pun
 * pengunjung tetap sampai ke form — sambil memberi tahu form paket mana
 * yang barusan dipilih.
 */
export function PickPackageButton({
  packageId,
  featured,
  children,
}: {
  packageId: string;
  featured?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href="#pesan"
      onClick={() => window.dispatchEvent(new CustomEvent(PICK_PACKAGE_EVENT, { detail: packageId }))}
      className={
        featured
          ? "mt-7 block rounded-full px-6 py-3 text-center text-sm font-medium text-[var(--holo-ink)] transition-transform duration-300 hover:scale-[1.02]"
          : "mt-7 block rounded-full border border-white/20 px-6 py-3 text-center text-sm font-medium text-white/85 transition hover:border-white/50 hover:text-white"
      }
      style={featured ? { background: "var(--holo-gradient)" } : undefined}
    >
      {children}
    </a>
  );
}
