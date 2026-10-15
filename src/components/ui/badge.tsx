import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const tones = {
  neutral: "bg-surface-raised text-ink-soft ring-line",
  brand: "bg-brand-soft text-brand-ink ring-brand/30",
  accent: "bg-accent-soft text-accent ring-accent/30",
  success: "bg-success-soft text-success ring-success/30",
  warning: "bg-warning-soft text-warning ring-warning/30",
  danger: "bg-danger-soft text-danger ring-danger/30",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
