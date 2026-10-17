"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Ticket, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mainNav, siteConfig } from "@/data/site";
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
        <div className="grid min-h-full lg:grid-cols-2">
          {/* Dummy image panel, matching the reference's menu layout — no
              render exists specifically for this yet, so it reuses the
              same company-profile shot used elsewhere on the site. */}
          <div className="relative hidden lg:block">
            <Image src="/renders/ambiance-hall.jpg" alt="" fill sizes="50vw" className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas-deep via-canvas-deep/10 to-transparent" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent to-canvas-deep/50" />
            <div className="absolute bottom-10 left-10 right-10">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">{siteConfig.name}</p>
              <p className="mt-2 font-display text-2xl text-ink">A Creative Technology Lab</p>
            </div>
          </div>

          <Container className="flex min-h-full flex-col py-10 lg:max-w-none lg:px-16 lg:py-16">
            <div className="my-auto">
              <nav aria-label="Navigasi utama">
                <ul>
                  {mainNav.map((link, index) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <li
                        key={link.href}
                        className={cn("border-b border-line", open && "motion-safe:animate-fade-up")}
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          className="group flex items-center gap-4 py-3.5 sm:py-4"
                        >
                          <span
                            className={cn(
                              "font-display text-xs tabular-nums transition-colors",
                              active ? "text-accent" : "text-muted group-hover:text-accent",
                            )}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "font-display flex-1 text-xl transition-colors sm:text-2xl",
                              active ? "text-accent" : "text-ink group-hover:text-accent",
                            )}
                          >
                            {link.label}
                          </span>
                          <ArrowUpRight
                            className={cn(
                              "size-4 shrink-0 text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100",
                              active && "opacity-100",
                            )}
                            aria-hidden
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <Link href="/pesan" className={buttonStyles({ size: "lg", className: "mt-10 w-full sm:w-auto" })}>
                <Ticket className="size-4" aria-hidden />
                Reservasi
              </Link>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}
