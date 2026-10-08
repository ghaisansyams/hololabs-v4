import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Single source of the page gutter: 20px on phones, growing with the viewport. */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  // @react-three/fiber's global JSX.IntrinsicElements augmentation (see
  // components/three/) makes TS try to unify `children` against every
  // three.js intrinsic tag too once `Tag` is generic — R3F/TS friction, not
  // a real type error. `any` sidesteps it; the public prop types above
  // still constrain callers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;
  return (
    <Component className={cn("mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8", className)}>
      {children}
    </Component>
  );
}
