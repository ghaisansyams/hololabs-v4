"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Ticket } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useChrome } from "@/components/layout/chrome-context";
import { cn } from "@/lib/utils/cn";

/**
 * Logo on the left; on wide screens the same anchors as hololabs.id
 * (Tentang, Journey, Info, FAQ) and the Reservasi button on the right.
 * There is no hamburger menu any more: the only pages left are the home
 * page, booking and ticket lookup. The bar hides while scrolling down and
 * returns when scrolling up.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { menuItems, reservationLabel } = useChrome();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 120) {
        setHidden(false);
        lastY.current = y;
      } else if (delta > 8) {
        setHidden(true);
        lastY.current = y;
      } else if (delta < -8) {
        setHidden(false);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // `translate` is its own property in Tailwind v4, so it must be in the transition list.
        "sticky top-0 z-50 border-b-0 bg-gradient-to-b from-black/60 via-black/25 to-transparent",
        "transition-[translate,opacity] duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
        // On the home page the content is pulled behind the header so the 3D scene reaches the top edge.
        isHome && "-mb-20 lg:-mb-24 [@media(max-height:520px)]:-mb-16",
        hidden &&
          "pointer-events-none -translate-y-full opacity-0 focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100",
      )}
    >
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Lompat ke konten
      </a>

      <Container className="flex h-20 max-w-none items-center justify-between gap-4 lg:h-24 lg:px-16 [@media(max-height:520px)]:h-16">
        <Link href="/" aria-label="Hololabs — beranda" className="shrink-0">
          <Logo className="h-14 sm:h-16 lg:h-[4.5rem] [@media(max-height:520px)]:h-11" />
        </Link>

        <div className="flex items-center gap-2 lg:gap-8">
          <nav aria-label="Navigasi utama" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {menuItems.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group relative inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-white/85 transition-colors hover:text-white"
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-2 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-cyan to-[#c026d3] transition-transform duration-300 group-hover:scale-x-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="/booking" className={buttonStyles({ size: "sm" })}>
            <Ticket className="size-4" aria-hidden />
            {reservationLabel}
          </Link>
        </div>
      </Container>
    </header>
  );
}
