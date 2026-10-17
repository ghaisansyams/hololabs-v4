import { MapPin } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";

/** Not a real address yet (see the FAQ: "Alamat venue akan diumumkan"), so
 * this just opens a generic Google Maps search rather than linking to a
 * specific place. */
const DUMMY_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Hololabs+Jakarta";

/**
 * A map-shaped card — not a real embedded map, just a grid pattern + pin,
 * since there's no address to show yet — that opens a Google Maps search
 * in a new tab when clicked. Mirrors meatguysteakhouse.com's "Open in
 * Maps" location cards.
 */
export function DummyMapCard({ label = "Lokasi venue (sementara)" }: { label?: string }) {
  return (
    <a
      href={DUMMY_MAPS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      aria-label="Buka lokasi Hololabs di Google Maps"
    >
      <TiltCard max={4}>
        <div className="group relative overflow-hidden rounded-card border border-line">
          <div
            aria-hidden
            className="relative flex h-56 items-center justify-center overflow-hidden bg-canvas-deep sm:h-72"
            style={{
              backgroundImage:
                "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-accent/10" />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-canvas shadow-glow transition-transform duration-300 group-hover:scale-110">
              <MapPin className="size-6" aria-hidden />
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface p-5">
            <div>
              <p className="text-sm font-bold text-ink">{label}</p>
              <p className="mt-0.5 text-xs text-muted">Alamat lengkap akan diumumkan menjelang hari show.</p>
            </div>
            <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-accent transition-colors group-hover:text-ink">
              Buka di Google Maps
            </span>
          </div>
        </div>
      </TiltCard>
    </a>
  );
}
