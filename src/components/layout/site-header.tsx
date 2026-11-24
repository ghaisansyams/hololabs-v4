"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useChrome } from "@/components/layout/chrome-context";
import { cn } from "@/lib/utils/cn";

/**
 * Logo on the left; on wide screens the page anchors and the Reservasi
 * button on the right. There is no hamburger menu: the only pages are the
 * home page and booking. The bar stays in place while scrolling, on a
 * translucent black background.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { menuItems, reservationLabel } = useChrome();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-black/70",
        // On the home page the content is pulled behind the header so the hero reaches the top edge.
        isHome && "-mb-20 lg:-mb-24 [@media(max-height:520px)]:-mb-16",
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
