import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-200 " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-brand to-accent text-canvas shadow-glow hover:brightness-110",
  secondary: "border border-line bg-surface text-ink hover:border-brand/50 hover:bg-surface-raised",
  ghost: "text-ink hover:bg-white/5",
  outline: "border border-accent/40 text-accent hover:bg-accent-soft",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-13 px-7 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
