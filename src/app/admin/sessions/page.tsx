import { AdminHeader } from "@/components/admin/page-header";
import { listSessions } from "@/lib/services/admin";
import { formatDate, formatWeekdayShort } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const sessions = await listSessions();
  return (
    <>
      <AdminHeader title="Sesi" description="Kapasitas dan sisa kursi setiap sesi, dihitung dari booking yang aktif." />
      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Tanggal</th>
              <th className="px-4 py-3 font-semibold">Jam</th>
              <th className="px-4 py-3 font-semibold">Kapasitas</th>
              <th className="px-4 py-3 font-semibold">Terisi</th>
              <th className="px-4 py-3 font-semibold">Sisa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-ink">
                  {formatWeekdayShort(s.sessionDate)}, {formatDate(s.sessionDate)}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)} WIB
                </td>
                <td className="px-4 py-3 text-ink-soft">{s.capacity}</td>
                <td className="px-4 py-3 text-ink-soft">{s.seatsTaken}</td>
                <td className={s.seatsLeft <= 0 ? "px-4 py-3 font-bold text-danger" : "px-4 py-3 font-bold text-success"}>
                  {s.seatsLeft}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
