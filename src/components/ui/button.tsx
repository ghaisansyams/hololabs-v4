import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-mono font-medium uppercase tracking-[0.08em] " +
  "transition-[transform,background-color,border-color,color,box-shadow] duration-200 " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary:
    "border border-white/20 bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#c026d3] text-white shadow-[0_0_28px_-6px_rgb(124_58_237/0.7)] hover:brightness-110 hover:shadow-[0_0_36px_-4px_rgb(124_58_237/0.9)]",
  secondary: "border border-cyan/50 bg-transparent text-cyan hover:border-cyan hover:bg-cyan-soft",
  ghost: "text-ink hover:bg-white/5",
  outline: "border border-line text-ink-soft hover:border-accent/50 hover:text-accent",
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
