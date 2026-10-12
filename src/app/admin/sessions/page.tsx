import { AdminHeader } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { listSessions } from "@/lib/services/admin";
import { formatDate, formatWeekdayShort } from "@/lib/utils/date";
import { createDayFromTemplate, createSession, deleteSession, updateSession } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal & Sesi" };

const input =
  "h-10 rounded-xl border border-line bg-canvas-deep px-3 text-sm text-ink outline-none focus:border-accent";

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const [{ ok, error }, sessions] = await Promise.all([searchParams, listSessions()]);

  const byDate = new Map<string, typeof sessions>();
  for (const s of sessions) byDate.set(s.sessionDate, [...(byDate.get(s.sessionDate) ?? []), s]);

  return (
    <>
      <AdminHeader
        title="Jadwal & Sesi"
        description="Atur tanggal, jam show, dan kapasitas. Perubahan langsung tampil di website dan halaman pemesanan."
      />

      {ok ? (
        <p className="mb-5 rounded-2xl border border-success/40 bg-success-soft px-4 py-3 text-sm text-success">{ok}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-5 rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <form action={createDayFromTemplate} className="rounded-card border border-line bg-surface p-5">
          <p className="font-bold text-ink">Tambah hari pameran</p>
          <p className="mt-1 text-sm text-muted">Membuat sesi dengan jam & kapasitas yang sama seperti hari terakhir.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-ink-soft">
              Tanggal
              <input type="date" name="date" required className={`${input} mt-1 block`} />
            </label>
            <button type="submit" className="h-10 rounded-pill bg-gradient-to-r from-brand to-accent px-5 text-sm font-semibold text-canvas">
              Tambah hari
            </button>
          </div>
        </form>

        <form action={createSession} className="rounded-card border border-line bg-surface p-5">
          <p className="font-bold text-ink">Tambah satu sesi</p>
          <p className="mt-1 text-sm text-muted">Untuk show tambahan di tanggal tertentu.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-ink-soft">
              Tanggal
              <input type="date" name="date" required className={`${input} mt-1 block`} />
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              Mulai
              <input type="time" name="startTime" required defaultValue="18:00" className={`${input} mt-1 block`} />
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              Selesai
              <input type="time" name="endTime" required defaultValue="19:30" className={`${input} mt-1 block`} />
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              Kursi
              <input type="number" name="capacity" min={1} max={500} required defaultValue={13} className={`${input} mt-1 block w-20`} />
            </label>
            <button type="submit" className="h-10 rounded-pill border border-line px-5 text-sm font-semibold text-ink hover:border-accent/50">
              Tambah sesi
            </button>
          </div>
        </form>
      </div>

      {byDate.size === 0 ? (
        <p className="text-sm text-muted">Belum ada sesi. Tambahkan hari pameran pertama di atas.</p>
      ) : (
        <div className="space-y-4">
          {Array.from(byDate.entries()).map(([date, list]) => (
            <div key={date} className="rounded-card border border-line bg-surface">
              <p className="border-b border-line px-5 py-3 text-sm font-bold text-ink">
                {formatWeekdayShort(date)}, {formatDate(date)}
              </p>
              <ul className="divide-y divide-line">
                {list.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-end gap-3 px-5 py-4">
                    <form action={updateSession} className="flex flex-wrap items-end gap-3">
                      <input type="hidden" name="sessionId" value={s.id} />
                      <label className="text-xs font-semibold text-ink-soft">
                        Mulai
                        <input type="time" name="startTime" defaultValue={s.startTime.slice(0, 5)} required className={`${input} mt-1 block`} />
                      </label>
                      <label className="text-xs font-semibold text-ink-soft">
                        Selesai
                        <input type="time" name="endTime" defaultValue={s.endTime.slice(0, 5)} required className={`${input} mt-1 block`} />
                      </label>
                      <label className="text-xs font-semibold text-ink-soft">
                        Kapasitas
                        <input type="number" name="capacity" min={Math.max(1, s.seatsTaken)} max={500} defaultValue={s.capacity} required className={`${input} mt-1 block w-20`} />
                      </label>
                      <button type="submit" className="h-10 rounded-pill border border-line px-4 text-xs font-semibold text-ink-soft hover:border-accent/50 hover:text-ink">
                        Simpan
                      </button>
                    </form>
                    <p className="ml-auto text-sm">
                      <span className="text-muted">Terisi </span>
                      <span className="font-semibold text-ink">{s.seatsTaken}</span>
                      <span className="text-muted"> · Sisa </span>
                      <span className={s.seatsLeft <= 0 ? "font-bold text-danger" : "font-bold text-success"}>{s.seatsLeft}</span>
                    </p>
                    <form action={deleteSession}>
                      <input type="hidden" name="sessionId" value={s.id} />
                      <ConfirmButton tone="danger" message="Hapus sesi ini dari jadwal?">
                        Hapus
                      </ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
