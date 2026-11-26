import Link from "next/link";
import { AdminHeader, StatusPill } from "@/components/admin/page-header";
import { ACTIVITY_CATEGORIES, listActivity, type ActivityRow } from "@/lib/services/activity-log";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log Aktivitas" };

const TONES: Record<string, "success" | "warning" | "danger" | "neutral" | "accent"> = {
  Login: "neutral",
  Booking: "accent",
  Pembayaran: "success",
  Email: "accent",
  Sesi: "warning",
  Konten: "warning",
  Pelanggan: "neutral",
  Ekspor: "neutral",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
/** "2026-11-27 14:05:09" → "27 Nov 2026" and "14.05.09". */
function when(wib: string) {
  const [d, t] = wib.split(" ");
  const [y, m, day] = d.split("-");
  return { date: `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`, time: t.replaceAll(":", ".") };
}

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { category = "", q = "", page = "1" } = await searchParams;
  const { items, total, page: current, pages } = await listActivity({ category, q, page: Number(page) });
  const active = (ACTIVITY_CATEGORIES as readonly string[]).includes(category) ? category : "";
  const href = (over: { category?: string; page?: number }) => {
    const params = new URLSearchParams();
    const c = over.category ?? active;
    if (c) params.set("category", c);
    if (q) params.set("q", q);
    if (over.page && over.page > 1) params.set("page", String(over.page));
    const text = params.toString();
    return `/admin/log${text ? `?${text}` : ""}`;
  };
  const failedLogin = (r: ActivityRow) => r.action === "Login gagal";

  const Who = ({ r }: { r: ActivityRow }) => (
    <>
      <p className="font-semibold text-ink">{r.actor}</p>
      <p className="font-mono text-xs text-muted">{r.ip || "IP tidak terdeteksi"}</p>
      {r.device ? <p className="text-xs text-muted">{r.device}</p> : null}
    </>
  );

  return (
    <>
      <AdminHeader
        title="Log Aktivitas"
        description="Catatan setiap perubahan di website: login, booking, pembayaran, jadwal, konten, email, dan ekspor. Catatan tidak bisa diubah atau dihapus dari sini."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {[{ value: "", label: "Semua" }, ...ACTIVITY_CATEGORIES.map((c) => ({ value: c as string, label: c as string }))].map((f) => (
            <Link
              key={f.value || "all"}
              href={href({ category: f.value })}
              className={cn(
                "shrink-0 rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active === f.value ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-soft hover:border-accent/40",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form action="/admin/log" className="flex gap-2">
          {active ? <input type="hidden" name="category" value={active} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari aksi, nomor booking, IP"
            className="h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent sm:w-72"
          />
        </form>
      </div>

      <p className="mb-3 text-xs text-muted">
        {total.toLocaleString("id-ID")} catatan{active ? ` kategori ${active}` : ""}
        {q ? ` untuk "${q}"` : ""}. Waktu dalam WIB.
      </p>

      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Waktu</th>
              <th className="px-3 py-3 font-semibold">Pelaku</th>
              <th className="px-3 py-3 font-semibold">Aktivitas</th>
              <th className="px-4 py-3 font-semibold">Rincian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Belum ada catatan untuk filter ini.
                </td>
              </tr>
            ) : null}
            {items.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-semibold text-ink">{when(r.wib).date}</p>
                  <p className="text-xs text-muted">{when(r.wib).time}</p>
                </td>
                <td className="px-3 py-3">
                  <Who r={r} />
                </td>
                <td className="px-3 py-3">
                  <StatusPill tone={failedLogin(r) ? "danger" : (TONES[r.category] ?? "neutral")}>{r.category}</StatusPill>
                  <p className="mt-1.5 font-semibold text-ink">{r.action}</p>
                  {r.target ? <p className="break-words font-mono text-xs text-ink-soft">{r.target}</p> : null}
                </td>
                <td className="max-w-md px-4 py-3 text-ink-soft">
                  <p className="break-words leading-relaxed">{r.detail || <span className="text-muted">-</span>}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 lg:hidden">
        {items.length === 0 ? <li className="rounded-card border border-line bg-surface px-4 py-10 text-center text-muted">Belum ada catatan untuk filter ini.</li> : null}
        {items.map((r) => (
          <li key={r.id} className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <StatusPill tone={failedLogin(r) ? "danger" : (TONES[r.category] ?? "neutral")}>{r.category}</StatusPill>
              <p className="text-right text-xs text-muted">
                {when(r.wib).date}
                <br />
                {when(r.wib).time}
              </p>
            </div>
            <p className="mt-2 font-semibold text-ink">{r.action}</p>
            {r.target ? <p className="break-all font-mono text-xs text-ink-soft">{r.target}</p> : null}
            {r.detail ? <p className="mt-2 break-words text-sm leading-relaxed text-ink-soft">{r.detail}</p> : null}
            <div className="mt-3 border-t border-line pt-3 text-sm">
              <Who r={r} />
            </div>
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav aria-label="Halaman log" className="mt-6 flex items-center justify-between gap-3 text-sm">
          {current > 1 ? (
            <Link href={href({ page: current - 1 })} className="rounded-pill border border-line px-4 py-2 font-semibold text-ink-soft hover:border-accent/50 hover:text-ink">
              ← Lebih baru
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Halaman {current} dari {pages}
          </span>
          {current < pages ? (
            <Link href={href({ page: current + 1 })} className="rounded-pill border border-line px-4 py-2 font-semibold text-ink-soft hover:border-accent/50 hover:text-ink">
              Lebih lama →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
