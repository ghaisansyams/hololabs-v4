import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Single source of the page gutter: 20px on phones, growing with the viewport (see .container-gutter). */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag className={cn("container-gutter mx-auto w-full max-w-7xl", className)}>
      {children}
    </Tag>
  );
}
