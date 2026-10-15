import type { SVGProps } from "react";

/** lucide-react ships no WhatsApp glyph; drawn here as a plain outline. */
export function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M3.5 20.5l1.3-4.1a8 8 0 1 1 3 3l-4.3 1.1Z" />
      <path d="M9.2 8.6c.3 2.9 2.6 5.3 5.5 5.7.6.1 1.2-.3 1.4-.9l.1-.5-2-1-.8.9a6 6 0 0 1-2.4-2.4l.9-.8-1-2-.5.1c-.7.2-1.1.8-1.2 1.4Z" />
    </svg>
  );
}
