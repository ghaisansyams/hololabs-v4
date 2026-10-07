import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getSql, hasDatabase } from "@/lib/db";

export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

async function counts() {
  const sql = getSql();
  if (!sql) return null;
  const [leads, bookings, drafts] = await Promise.all([
    sql`select
          count(*) filter (where status = 'NEW')::int as baru,
          count(*) filter (where created_at > now() - interval '30 days')::int as bulan_ini,
          count(*)::int as total
        from leads`,
    sql`select
          count(*) filter (where status = 'PENDING')::int as menunggu,
          count(*) filter (where preferred_date >= current_date and status in ('PENDING','CONFIRMED'))::int as mendatang,
          coalesce(sum(people) filter (where status in ('CONFIRMED','ATTENDED')), 0)::int as kursi
        from bookings`,
    sql`select count(*)::int as belum_terbit
        from cms_sections
        where page_key = 'home' and draft is distinct from published`,
  ]);
  return {
    leads: (leads as Record<string, number>[])[0],
    bookings: (bookings as Record<string, number>[])[0],
    drafts: (drafts as Record<string, number>[])[0],
  };
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-white/50">{label}</p>
      <p className="holo-display mt-2 text-3xl tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-white/35">{hint}</p> : null}
    </div>
  );
}

export default async function AdminDashboard() {
  if (!hasDatabase()) redirect("/admin/login");
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const data = await counts();
  if (!data) redirect("/admin/login");

  return (
    <div>
      <h1 className="holo-display text-2xl text-white">Dashboard</h1>
      <p className="mt-1.5 text-sm text-white/45">Ringkasan lead, reservasi, dan status terbit.</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Lead baru" value={data.leads.baru} hint="Belum dihubungi" />
        <Stat label="Lead 30 hari terakhir" value={data.leads.bulan_ini} />
        <Stat label="Total lead" value={data.leads.total} />
        <Stat label="Reservasi menunggu" value={data.bookings.menunggu} hint="Perlu dikonfirmasi" />
        <Stat label="Kunjungan mendatang" value={data.bookings.mendatang} />
        <Stat label="Kursi terkonfirmasi" value={data.bookings.kursi} />
      </div>

      {data.drafts.belum_terbit > 0 ? (
        <div className="mt-7 rounded-xl border border-[color-mix(in_srgb,var(--holo-cyan)_40%,transparent)] bg-white/[0.03] p-5">
          <p className="text-sm text-white/80">
            {data.drafts.belum_terbit} section punya perubahan draft yang belum terbit.
          </p>
          <Link
            href="/admin/content"
            className="mt-3 inline-block text-xs text-[var(--holo-cyan)] underline underline-offset-4"
          >
            Buka Website Builder →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
