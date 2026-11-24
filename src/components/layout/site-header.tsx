"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Ticket, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useChrome } from "@/components/layout/chrome-context";
import { cn } from "@/lib/utils/cn";

/**
 * Logo on the left. On wide screens the page anchors and the Reservasi button
 * sit on the right. On phones and tablets the Reservasi button sits in the
 * middle and a hamburger on the right opens the same anchors in a panel under
 * the bar. The bar stays in place while scrolling, on translucent black.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { menuItems, reservationLabel } = useChrome();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
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

      <Container className="grid h-20 max-w-none grid-cols-[1fr_auto_1fr] items-center gap-3 lg:flex lg:h-24 lg:justify-between lg:gap-4 lg:px-16 [@media(max-height:520px)]:h-16">
        <Link href="/" aria-label="Hololabs — beranda" className="shrink-0 justify-self-start">
          <Logo className="h-12 sm:h-16 lg:h-[4.5rem] [@media(max-height:520px)]:h-11" />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden lg:ml-auto lg:block">
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

        <Link href="/booking" className={buttonStyles({ size: "sm", className: "justify-self-center lg:ml-8" })}>
          <Ticket className="size-4" aria-hidden />
          {reservationLabel}
        </Link>

        <button
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="menu-ponsel"
          onClick={() => setOpen((v) => !v)}
          className="flex size-11 items-center justify-center justify-self-end rounded-full border border-white/15 text-white transition-colors hover:border-cyan/60 lg:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </Container>

      {/* phones and tablets: the anchors in a panel under the bar */}
      <nav
        id="menu-ponsel"
        aria-label="Menu"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-white/10 bg-black/90 lg:hidden"
      >
        <ul className="container-gutter mx-auto flex max-w-7xl flex-col py-2">
          {menuItems.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center border-b border-white/5 text-base font-semibold text-white/85 transition-colors last:border-0 hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
