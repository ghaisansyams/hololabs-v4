import { cn } from "@/lib/utils/cn";

/**
 * Holomoc Exhibition mark — a seat/aperture motif in a gradient ring,
 * standing in for the exhibition's own artwork until that is supplied.
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
        <linearGradient id="holomoc-mark" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="9" fill="url(#holomoc-mark)" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="#0a0710" strokeWidth="1.6" strokeDasharray="3.2 3.6" />
      <circle cx="16" cy="16" r="3.4" fill="#0a0710" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {showWordmark ? (
        <span className="text-[1.0625rem] leading-none font-extrabold tracking-tight text-ink font-display">
          HOLO<span className="text-gradient">MOC</span>
        </span>
      ) : null}
    </span>
  );
}
