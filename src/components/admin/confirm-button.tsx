"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Submit button that asks for confirmation before a destructive server action runs. */
export function ConfirmButton({
  message,
  children,
  tone = "neutral",
  className,
  form,
}: {
  message: string;
  children: ReactNode;
  tone?: "neutral" | "primary" | "danger";
  className?: string;
  form?: string;
}) {
  return (
    <button
      type="submit"
      form={form}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={cn(
        "inline-flex h-8 items-center whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors",
        tone === "primary" && "border-transparent bg-brand text-ink hover:bg-brand-dark",
        tone === "danger" && "border-transparent text-danger hover:bg-danger-soft",
        tone === "neutral" && "border-line text-ink-soft hover:border-accent/50 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
