import { AdminHeader } from "@/components/admin/page-header";
import { reportByDate, reportByPackage } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils/date";
import { formatRupiah } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [byPackage, byDate] = await Promise.all([reportByPackage(), reportByDate()]);
  const totalRevenue = byPackage.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <>
      <AdminHeader
        title="Laporan"
        description={`Pendapatan lunas total ${formatRupiah(totalRevenue)}. Booking dibatalkan tidak dihitung.`}
      />

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">Per paket</h2>
      <div className="mb-10 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Paket</th>
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-4 py-3 font-semibold">Kursi</th>
              <th className="px-4 py-3 font-semibold">Pendapatan lunas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {byPackage.map((r) => (
              <tr key={r.packageName}>
                <td className="px-4 py-3 font-semibold text-ink">{r.packageName}</td>
                <td className="px-4 py-3 text-ink-soft">{r.bookings}</td>
                <td className="px-4 py-3 text-ink-soft">{r.seats}</td>
                <td className="px-4 py-3 text-ink">{formatRupiah(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">Per tanggal</h2>
      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Tanggal</th>
              <th className="px-4 py-3 font-semibold">Kursi terjual</th>
              <th className="px-4 py-3 font-semibold">Kapasitas</th>
              <th className="px-4 py-3 font-semibold">Pendapatan lunas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {byDate.map((r) => (
              <tr key={r.sessionDate}>
                <td className="px-4 py-3 font-semibold text-ink">{formatDate(r.sessionDate)}</td>
                <td className="px-4 py-3 text-ink-soft">{r.seatsSold}</td>
                <td className="px-4 py-3 text-ink-soft">{r.capacity}</td>
                <td className="px-4 py-3 text-ink">{formatRupiah(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
