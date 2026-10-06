import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Ticket, CalendarDays, Package, Users, BarChart3, ScanLine, LogOut } from "lucide-react";
import { logout } from "./actions";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin Holomoc" },
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Booking", icon: Ticket },
  { href: "/admin/check-in", label: "Check-in", icon: ScanLine },
  { href: "/admin/sessions", label: "Sesi", icon: CalendarDays },
  { href: "/admin/packages", label: "Paket F&B", icon: Package },
  { href: "/admin/customers", label: "Pelanggan", icon: Users },
  { href: "/admin/reports", label: "Laporan", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="border-b border-line bg-canvas-deep/80 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:flex-col lg:items-stretch lg:gap-8 lg:py-6">
          <Link href="/admin" aria-label="Dashboard admin">
            <Logo className="h-5 w-auto" />
          </Link>
          <nav aria-label="Navigasi admin" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-raised hover:text-ink"
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logout} className="hidden lg:block">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex justify-end lg:hidden">
            <form action={logout}>
              <button type="submit" className="text-sm font-semibold text-muted hover:text-ink">
                Keluar
              </button>
            </form>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
