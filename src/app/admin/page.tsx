import { AdminHeader } from "@/components/admin/page-header";
import { getDashboardStats, listSessions } from "@/lib/services/admin";
import { formatRupiah } from "@/lib/utils/format";
import { formatDayMonth, formatWeekdayShort } from "@/lib/utils/date";
import { isDatabaseConfigured } from "@/lib/db/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!isDatabaseConfigured()) {
    return <p className="text-sm text-danger">DATABASE_URL belum diisi.</p>;
  }
  const [stats, sessions] = await Promise.all([getDashboardStats(), listSessions()]);
  const totalCapacity = sessions.reduce((sum, s) => sum + s.capacity, 0);
  const soldPercent = totalCapacity ? Math.round((stats.seatsSold / totalCapacity) * 100) : 0;

  const cards = [
    { label: "Booking aktif", value: stats.activeBookings.toLocaleString("id-ID") },
    { label: "Menunggu pembayaran", value: stats.pendingPayments.toLocaleString("id-ID") },
    { label: "Pendapatan (lunas)", value: formatRupiah(stats.revenue) },
    { label: "Kursi terjual", value: `${stats.seatsSold} / ${totalCapacity}` },
    { label: "Dialihkan otomatis", value: stats.autoRouted.toLocaleString("id-ID") },
    { label: "Sudah check-in", value: stats.checkedIn.toLocaleString("id-ID") },
  ];

  // Peringatan jadwal: tanpa sesi mendatang, halaman Reservasi kosong untuk pengunjung.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const upcomingDays = new Set(sessions.filter((s) => s.sessionDate >= today).map((s) => s.sessionDate)).size;

  const byDate = new Map<string, typeof sessions>();
  for (const s of sessions) byDate.set(s.sessionDate, [...(byDate.get(s.sessionDate) ?? []), s]);

  return (
    <>
      <AdminHeader title="Dashboard" description={`Ringkasan booking — ${soldPercent}% kapasitas terisi.`} />

      {upcomingDays <= 2 ? (
        <div
          role="alert"
          className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
            upcomingDays === 0
              ? "border-danger/40 bg-danger-soft text-danger"
              : "border-warning/40 bg-warning-soft text-warning"
          }`}
        >
          <p>
            {upcomingDays === 0
              ? "Tidak ada jadwal show ke depan. Halaman Reservasi kosong, pengunjung belum bisa memesan."
              : `Jadwal show tinggal ${upcomingDays} hari ke depan. Tambahkan tanggal baru supaya reservasi tetap bisa dipakai.`}
          </p>
          <Link href="/admin/sessions" className="font-bold underline underline-offset-2">
            Atur jadwal
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-card border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-ink font-display">{card.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-bold uppercase tracking-wide text-accent">Kapasitas per sesi</h2>
      <div className="space-y-3">
        {Array.from(byDate.entries()).map(([date, list]) => (
          <div key={date} className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm font-bold text-ink">
              {formatWeekdayShort(date)}, {formatDayMonth(date)}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {list.map((s) => {
                const pct = Math.round((s.seatsTaken / s.capacity) * 100);
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-xs text-ink-soft">
                      <span>{s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}</span>
                      <span>
                        {s.seatsTaken}/{s.capacity}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-canvas-deep">
                      <div className="h-full rounded-pill bg-gradient-to-r from-brand to-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
