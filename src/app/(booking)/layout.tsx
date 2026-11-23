import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";

// The booking flow wears hololabs.id/booking's own type: Space Grotesk for
// headings, Inter for text, Michroma for the wide eyebrow labels.
const display = localFont({
  src: "../fonts/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-hl-display",
  display: "swap",
});
const sans = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-hl-sans",
  display: "swap",
});
const label = localFont({
  src: "../fonts/michroma-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-hl-label",
  display: "swap",
});

// Seats and payment status change by the minute.
export const dynamic = "force-dynamic";

/** Standalone chrome for /booking and the payment page, as on hololabs.id: wordmark, a way home, two soft glows. */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${sans.variable} ${label.variable} hl-scope relative min-h-dvh flex-1 overflow-clip`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_500px_at_75%_10%,rgba(139,92,246,.18),transparent_70%),radial-gradient(600px_400px_at_10%_60%,rgba(34,211,238,.08),transparent_70%)] print:hidden"
      />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-6">
        <Link href="/" aria-label="Kembali ke beranda HOLOLABS">
          <Image src="/img/wordmark.png" alt="HOLOLABS" width={512} height={56} priority className="h-4 w-auto" />
        </Link>
        <Link href="/" className="text-[15px] text-cyan-200 underline-offset-4 hover:underline print:hidden">
          ← Beranda
        </Link>
      </header>
      <main id="konten" className="relative mx-auto flex max-w-6xl flex-col gap-6 px-5 pb-20 pt-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}
