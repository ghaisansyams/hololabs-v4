"use client";

import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";

export function PrintButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonStyles({ variant: "secondary", size: "lg", className: `no-print ${className ?? ""}` })}>
      {children}
    </button>
  );
}
