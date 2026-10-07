import Link from "next/link";

import { getSession } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";
import { signOutAction } from "./actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content", label: "Website Builder" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/bookings", label: "Reservasi" },
  { href: "/admin/audit", label: "Audit Log", superOnly: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = hasDatabase() ? await getSession() : null;

  // Halaman login merender dirinya sendiri tanpa kerangka ini.
  if (!session) return <div className="min-h-dvh bg-[#0b0d12]">{children}</div>;

  return (
    <div className="min-h-dvh bg-[#0b0d12] text-white/85">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="holo-display text-sm tracking-[0.2em]">
            HOLO<span className="holo-gradient-text">LABS</span>
            <span className="ml-2 text-[10px] font-normal tracking-normal text-white/40">admin</span>
          </Link>

          <nav className="flex flex-1 flex-wrap gap-1" aria-label="Menu admin">
            {NAV.filter((item) => !item.superOnly || session.role === "SUPER_ADMIN").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-white/45">
              {session.name || session.email}
              <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                {session.role === "SUPER_ADMIN" ? "Super Admin" : "Content Admin"}
              </span>
            </span>
            <form action={signOutAction}>
              <button className="rounded-md border border-white/15 px-3 py-1.5 text-white/70 transition hover:border-white/40 hover:text-white">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
