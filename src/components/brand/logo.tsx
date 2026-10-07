import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Hololabs's real artwork (from their company profile PDF, supplied
 * 7 Oct 2026) sits on a white background with near-white highlight facets
 * inside the mark itself — a plain color-key to transparency would eat
 * into those highlights. Rather than risk mangling the mark, both crops
 * keep their white background and sit inside a small white rounded chip,
 * a standard way to carry a light-background mark onto a dark page.
 */

/** Compact square mark — icon-only, for places a full wordmark doesn't fit. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-soft", className)}>
      <Image src="/hololabs-mark.png" alt="Hololabs" width={735} height={735} className="size-full rounded-lg object-contain" priority />
    </span>
  );
}

/** Full lockup: mark + "HOLOLABS" wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-xl bg-white px-2.5 py-1.5 shadow-soft", className)}>
      <Image
        src="/hololabs-lockup.png"
        alt="Hololabs"
        width={1249}
        height={745}
        priority
        className="h-7 w-auto object-contain sm:h-8"
      />
    </span>
  );
}
