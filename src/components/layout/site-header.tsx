"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Ticket, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mainNav } from "@/data/site";
import { cn } from "@/lib/utils/cn";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Logo + a Reservasi button + a hamburger, mirroring
 * meatguysteakhouse.com's header. The hamburger opens a full-screen menu
 * (on every breakpoint, not just mobile) listing every page that doesn't
 * have its own always-visible entry point — Ambiance, Collection, Rundown,
 * Our Story each got their own route (see src/app/(public)/*), so picking
 * one is a real navigation, not a scroll back to the homepage.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    // Fragment, not a single <header>: Firefox treats `position: sticky`
    // as establishing a containing block for `position: fixed`
    // descendants (most engines don't), which collapsed the full-screen
    // overlay to zero height when it lived inside the sticky header. As a
    // sibling instead, its `fixed` positioning is relative to the
    // viewport everywhere.
    <>
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || open
          ? "border-b border-line bg-canvas/95 supports-[backdrop-filter]:bg-canvas/75 supports-[backdrop-filter]:backdrop-blur-xl"
          : "border-b border-transparent bg-canvas/70 supports-[backdrop-filter]:bg-canvas/40 supports-[backdrop-filter]:backdrop-blur-md",
      )}
    >
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Lompat ke konten
      </a>

      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Link href="/" aria-label="Hololabs — beranda" className="shrink-0">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/pesan" className={buttonStyles({ size: "sm" })}>
            <Ticket className="size-4" aria-hidden />
            Reservasi
          </Link>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-overlay"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors hover:bg-surface-raised"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </Container>
    </header>

      <div
        id="menu-overlay"
        hidden={!open}
        className="fixed inset-0 top-16 z-40 overflow-y-auto bg-canvas-deep/98 supports-[backdrop-filter]:backdrop-blur-2xl lg:top-[4.5rem]"
      >
        <Container className="flex min-h-full flex-col justify-start py-12 sm:py-16">
          <nav aria-label="Navigasi utama">
            <ul className="flex flex-col gap-1">
              {mainNav.map((link, index) => {
                const active = isActive(pathname, link.href);
                return (
                  <li
                    key={link.href}
                    className={cn(open && "motion-safe:animate-fade-up")}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-16 items-center justify-between border-b border-line text-2xl transition-colors sm:text-3xl",
                        active ? "text-accent" : "text-ink hover:text-accent",
                      )}
                    >
                      {link.label}
                      {active ? <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link href="/pesan" className={buttonStyles({ size: "lg", className: "mt-8 w-full sm:w-auto" })}>
            <Ticket className="size-4" aria-hidden />
            Reservasi
          </Link>
        </Container>
      </div>
    </>
  );
}
