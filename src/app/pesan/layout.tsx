/**
 * Reservation gets its own full-screen chrome — no site header/footer —
 * mirroring meatguysteakhouse.com's dedicated reservation screen rather
 * than an inline section on the homepage.
 */
export default function PesanLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh bg-canvas-deep">{children}</main>;
}
