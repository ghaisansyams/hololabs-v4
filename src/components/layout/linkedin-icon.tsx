import type { SVGProps } from "react";

/** lucide-react v1 dropped brand glyphs; drawn here as a plain outline. */
export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 10.5V16" />
      <circle cx="8" cy="7.8" r="0.6" fill="currentColor" />
      <path d="M12 16v-5.5M12 13c0-1.6 1-2.5 2.3-2.5S16.5 11.4 16.5 13V16" />
    </svg>
  );
}
