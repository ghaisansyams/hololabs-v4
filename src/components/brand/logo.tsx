import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Compact square mark — used where a wordmark doesn't fit (e.g. the 404
 * page's centerpiece). Holomoc's own square icon hasn't been supplied yet,
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

/** Holomoc's own wordmark artwork. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-holomoc.png"
      alt="Holomoc"
      width={1848}
      height={217}
      priority
      className={cn("h-6 w-auto sm:h-7", className)}
    />
  );
}
