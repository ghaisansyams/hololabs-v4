import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * A picture of the map around HOLOLABS (OpenStreetMap, restyled dark, saved
 * in /public/map) with a pin in the middle. The whole card links to the
 * location in Google Maps. The pin sits at the image centre, which
 * object-cover keeps at the centre of the card at any size.
 */
export function MapCard({
  href,
  address,
  cta,
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  compact = false,
}: {
  href: string;
  address: string;
  cta: string;
  className?: string;
  sizes?: string;
  /** Only the button, no address panel (for small cards). */
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${cta}: HOLOLABS, ${address}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#0a0716] outline-none focus-visible:ring-2 focus-visible:ring-cyan",
        className,
      )}
    >
      <Image
        src="/map/hololabs-map.jpg"
        alt=""
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_25%,rgb(7_4_26/0.6)_100%)]"
      />

      {/* pin: its tip on the image centre */}
      <span aria-hidden className="absolute left-1/2 top-1/2">
        <span className="absolute -left-6 -top-6 size-12 rounded-full bg-cyan/25 motion-safe:animate-ping" />
        <span className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-cyan shadow-[0_0_12px_rgb(34_211_238/0.9)]" />
        <span className="absolute -left-6 -top-14 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-white shadow-[0_8px_24px_rgb(168_85_247/0.55)] ring-2 ring-white/80">
          <MapPin className="size-6" strokeWidth={2.4} />
        </span>
      </span>

      {compact ? (
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-accent px-4 py-2 text-xs font-bold text-white">
          {cta}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </span>
      ) : (
        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/70 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-[0.14em] text-ink">
              HOLOLABS
            </p>
            <p className="mt-1 text-xs leading-5 text-ink-soft">{address}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-gradient-to-r from-brand to-accent px-4 py-2 text-xs font-bold text-white sm:self-auto">
            {cta}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </div>
      )}
      <span className="absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[0.625rem] text-white/70">
        © OpenStreetMap
      </span>
    </a>
  );
}
