"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Ticket, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useChrome } from "@/components/layout/chrome-context";
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
  const isHome = pathname === "/";
  const { menuItems, reservationLabel, menuImage, menuEyebrow, menuTagline } = useChrome();
  const [open, setOpen] = useState(false);
  // Bar atas bersembunyi saat scroll turun dan muncul lagi saat scroll naik.
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const openRef = useRef(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 120 || openRef.current) {
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

  useEffect(() => {
    openRef.current = open;
    if (open) setHidden(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Lock scrolling on <html>, not <body>. <html> has `overflow-x: clip`
    // (see globals.css), so Firefox doesn't hand a body `overflow: hidden`
    // up to the viewport; the body became its own scroll container, the
    // sticky header scrolled away and the page showed through the overlay.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = previous;
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
        // Gerakan memakai properti `translate` (Tailwind v4), jadi harus ikut
        // di daftar transisi; kalau tidak, bar hilang mendadak tanpa animasi.
        "sticky top-0 z-50 transition-[translate,opacity,background-color] duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
        // Beranda: konten ditarik ke belakang header supaya hero tampil sampai tepi atas.
        isHome && "-mb-20 lg:-mb-24 [@media(max-height:520px)]:-mb-16",
        // Tersembunyi saat scroll turun; tetap muncul bila fokus keyboard ada di dalamnya.
        hidden && !open && "pointer-events-none -translate-y-full opacity-0 focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100",
        // Selalu transparan (tanpa blok gelap dan garis); gradasi tipis menjaga logo terbaca.
        open ? "border-b border-line bg-canvas-deep" : "border-b-0 bg-gradient-to-b from-black/55 via-black/20 to-transparent",
      )}
    >
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Lompat ke konten
      </a>

      {/* Selebar layar (bukan max-w-7xl): logo menempel ke kiri dan tombol ke kanan,
            sejajar dengan isi menu, termasuk di TV/monitor besar. */}
      <Container className="flex h-20 max-w-none items-center justify-between gap-4 lg:h-24 lg:px-16 [@media(max-height:520px)]:h-16">
        <Link href="/" aria-label="Hololabs — beranda" className="shrink-0">
          <Logo className="h-14 sm:h-16 lg:h-[4.5rem] [@media(max-height:520px)]:h-11" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/pesan"
            className={buttonStyles({
              size: "sm",
              className: "border border-[#5b53c9]/60 bg-[#2a2468] shadow-none hover:bg-[#373092]",
            })}
          >
            <Ticket className="size-4" aria-hidden />
            {reservationLabel}
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
        className="fixed inset-0 top-20 z-40 overflow-y-auto bg-canvas-deep lg:top-24 [@media(max-height:520px)]:top-16"
      >
        <div className="grid min-h-full lg:grid-cols-2">
          {/* Dummy image panel, matching the reference's menu layout — no
              render exists specifically for this yet, so it reuses the
              same company-profile shot used elsewhere on the site. */}
          <div className="relative hidden lg:block">
            <Image src={menuImage} alt="" fill sizes="50vw" className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas-deep via-canvas-deep/10 to-transparent" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent to-canvas-deep/50" />
            <div className="absolute bottom-10 left-10 right-10">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">{menuEyebrow}</p>
              <p className="mt-2 font-display text-2xl text-ink">{menuTagline}</p>
            </div>
          </div>

          <Container className="flex min-h-full flex-col py-10 lg:max-w-none lg:px-16 lg:py-16 [@media(max-height:520px)]:py-4">
            <div className="my-auto">
              <nav aria-label="Navigasi utama">
                <ul>
                  {menuItems.map((link, index) => {
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
                          className="group flex items-center gap-4 py-3.5 sm:py-4 [@media(max-height:520px)]:py-2"
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
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}
