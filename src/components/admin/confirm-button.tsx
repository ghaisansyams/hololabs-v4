"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Submit button that asks for confirmation before a destructive server action runs. */
export function ConfirmButton({
  message,
  children,
  tone = "neutral",
  className,
}: {
  message: string;
  children: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={cn(
        "rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors",
        tone === "danger"
          ? "border-danger/40 text-danger hover:bg-danger-soft"
          : "border-line text-ink-soft hover:border-accent/50 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
