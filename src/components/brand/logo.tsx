import { cn } from "@/lib/utils/cn";

/**
 * Compact square mark — used where a wordmark doesn't fit (e.g. the 404
 * page's centerpiece). Hololabs's own square icon hasn't been supplied yet,
 * so this stands in until then.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={cn("size-9", className)}
    >
      <defs>
        <linearGradient id="hololabs-mark" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="9" fill="url(#hololabs-mark)" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="#0a0710" strokeWidth="1.6" strokeDasharray="3.2 3.6" />
      <circle cx="16" cy="16" r="3.4" fill="#0a0710" />
    </svg>
  );
}

/**
 * Hololabs's real logo artwork hasn't been supplied yet (7 Oct 2026 rename
 * from Holomoc — a file was referenced but never attached). Until it
 * arrives, the wordmark is rendered as CSS "3D extruded" type — a stacked
 * text-shadow giving it visible depth — so the header isn't carrying a flat
 * text label while the rest of the site leans into a 3D feel. Swap this for
 * an <Image> of the real mark the moment it's provided; nothing else
 * referencing <Logo /> needs to change.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("logo-3d font-display text-xl font-extrabold tracking-tight sm:text-2xl", className)}>
      <span className="logo-3d-face">HOLOLABS</span>
    </span>
  );
}
