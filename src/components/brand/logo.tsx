import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Hololabs's real artwork (from their company profile PDF, supplied
 * 7 Oct 2026), with the white background properly removed: the icon mark's
 * background was cut via border-connected flood fill (so the near-white
 * highlight facets *inside* the mark stay intact — a plain color threshold
 * would've eaten into them), and the flat-navy "HOLOLABS" wordmark was
 * re-colored to a light tone for legibility on this dark theme (its
 * letterform counters are properly transparent too, unlike a naive crop).
 * See the asset-prep notes for the exact pipeline if it ever needs re-doing
 * from the source PDF.
 */

/** Compact square mark — icon-only, for places a full wordmark doesn't fit. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/hololabs-mark.png"
      alt="Hololabs"
      width={715}
      height={586}
      className={cn("h-9 w-auto object-contain", className)}
      priority
    />
  );
}

/** Full lockup: mark + "HOLOLABS" wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/hololabs-lockup.png"
      alt="Hololabs"
      width={1269}
      height={756}
      priority
      className={cn("h-9 w-auto object-contain sm:h-10", className)}
    />
  );
}
