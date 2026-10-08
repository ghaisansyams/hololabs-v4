import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getSql, hasDatabase } from "@/lib/db";
import { journey } from "@/content/site";
import { formatRupiah, formatTimeRange } from "@/lib/format";
import { StatusSelect } from "../status-select";
import { updateBookingStatusAction } from "../actions";

export const metadata = { title: "Reservasi", robots: { index: false, follow: false } };

const STATUSES = [
  { value: "PENDING", label: "Menunggu" },
  { value: "CONFIRMED", label: "Dikonfirmasi" },
  { value: "ATTENDED", label: "Hadir" },
  { value: "NO_SHOW", label: "Tidak hadir" },
  { value: "CANCELLED", label: "Batal" },
];

const VISITOR_LABEL = new Map(journey.visitorTypes.map((t) => [t.key, t.label]));

interface Booking {
  id: string;
  code: string;
  name: string;
  whatsapp: string;
  email: string;
  people: number;
  visitor_type: string;
  preferred_date: string;
  note: string;
  status: string;
  created_at: string;
  seats: number | null;
  amount: string;
  auto_routed: boolean;
  package_name: string | null;
  start_time: string | null;
  end_time: string | null;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!hasDatabase()) redirect("/admin/login");
  if (!(await getSession())) redirect("/admin/login");

  const { status } = await searchParams;
  const sql = getSql()!;
  // Booking show (paket + sesi) dan booking lama sebelum paket ada sama-sama
  // tampil: kolom paket/sesi boleh kosong untuk yang lama.
  const filter = status && STATUSES.some((s) => s.value === status) ? status : null;
  const rows = (await sql`
    select b.*, p.name as package_name,
           s.start_time::text as start_time, s.end_time::text as end_time
    from bookings b
    left join packages p on p.id = b.package_id
    left join show_sessions s on s.id = b.session_id
    where (${filter}::text is null or b.status = ${filter})
    order by b.preferred_date asc, s.start_time asc nulls last
    limit 200
  `) as unknown as Booking[];

  const seats = rows
    .filter((b) => b.status === "CONFIRMED" || b.status === "ATTENDED")
    .reduce((sum, b) => sum + b.people, 0);

  return (
    <div>
      <h1 className="holo-display text-2xl text-white">Reservasi Experience Journey</h1>
      <p className="mt-1.5 text-sm text-white/45">
        {rows.length} reservasi · {seats} kursi terkonfirmasi.
      </p>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Filter status">
        <a
          href="/admin/bookings"
          className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
            !status ? "border-white/50 text-white" : "border-white/15 text-white/50"
          }`}
        >
          Semua
        </a>
        {STATUSES.map((s) => (
          <a
            key={s.value}
            href={`/admin/bookings?status=${s.value}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
              status === s.value ? "border-white/50 text-white" : "border-white/15 text-white/50"
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-white/35">Belum ada reservasi.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-white/[0.04] text-xs text-white/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">Kode</th>
                <th scope="col" className="px-4 py-3 font-normal">Tanggal & sesi</th>
                <th scope="col" className="px-4 py-3 font-normal">Pemesan</th>
                <th scope="col" className="px-4 py-3 font-normal">Paket</th>
                <th scope="col" className="px-4 py-3 font-normal">Kursi</th>
                <th scope="col" className="px-4 py-3 font-normal">Total</th>
                <th scope="col" className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-white/80">{booking.code}</td>
                  <td className="px-4 py-3 text-xs text-white/70">
                    {new Date(booking.preferred_date).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {booking.start_time && booking.end_time ? (
                      <span className="block text-white/45">
                        {formatTimeRange(booking.start_time, booking.end_time)}
                      </span>
                    ) : null}
                    {booking.auto_routed ? (
                      <span className="mt-1 block text-[var(--holo-magenta)]">Dipindah otomatis</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-white/85">{booking.name}</span>
                    <br />
                    <a
                      href={`https://wa.me/${booking.whatsapp.replace(/\D/g, "")}`}
                      className="text-white/45 underline underline-offset-2"
                    >
                      {booking.whatsapp}
                    </a>
                    {booking.note ? (
                      <span className="mt-1 block max-w-xs text-white/35">{booking.note}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">
                    {booking.package_name ?? VISITOR_LABEL.get(booking.visitor_type) ?? booking.visitor_type}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-white/70">{booking.seats ?? booking.people}</td>
                  <td className="px-4 py-3 text-xs tabular-nums text-white/70">
                    {Number(booking.amount) > 0 ? formatRupiah(Number(booking.amount)) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      id={booking.id}
                      current={booking.status}
                      options={STATUSES}
                      action={updateBookingStatusAction}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
