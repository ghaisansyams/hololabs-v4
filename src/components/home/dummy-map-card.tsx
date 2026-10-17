import Image from "next/image";
import { TiltCard } from "@/components/ui/tilt-card";

/** Real location, from the client. */
const MAPS_URL = "https://maps.app.goo.gl/UJTHbjNEDMiDtwdx7";

/**
 * A map card — a real OpenStreetMap render of the venue's coordinates
 * with a pin, styled after meatguysteakhouse.com's "Open in Maps" location
 * cards — that opens Google Maps in a new tab when clicked.
 */
export function DummyMapCard({ label = "Lokasi Hololabs" }: { label?: string }) {
  return (
    <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="block" aria-label="Buka lokasi Hololabs di Google Maps">
      <TiltCard max={4}>
        <div className="group relative overflow-hidden rounded-card border border-line">
          <div className="relative h-56 overflow-hidden sm:h-72">
            <Image
              src="/renders/map.jpg"
              alt="Peta lokasi Hololabs"
              fill
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover grayscale-[15%] transition-transform duration-500 group-hover:scale-105"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas-deep/70 via-transparent to-transparent" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-pill bg-canvas-deep/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink backdrop-blur-sm">
              Open in Maps
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface p-5">
            <div>
              <p className="text-sm font-bold text-ink">{label}</p>
              <p className="mt-0.5 text-xs text-muted">Klik untuk buka rute di Google Maps.</p>
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
