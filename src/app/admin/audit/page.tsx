import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getSql, hasDatabase } from "@/lib/db";

export const metadata = { title: "Audit Log", robots: { index: false, follow: false } };

interface Entry {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  new_value: unknown;
  ip: string | null;
  created_at: string;
  name: string | null;
  email: string | null;
}

export default async function AuditPage() {
  if (!hasDatabase()) redirect("/admin/login");
  const session = await getSession();
  if (!session) redirect("/admin/login");
  // Audit log hanya untuk Super Admin (PRD bagian 3).
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const sql = getSql()!;
  const rows = (await sql`
    select a.id, a.action, a.entity, a.entity_id, a.new_value, a.ip, a.created_at,
           u.name, u.email
    from audit_logs a left join users u on u.id = a.user_id
    order by a.created_at desc limit 200
  `) as unknown as Entry[];

  return (
    <div>
      <h1 className="holo-display text-2xl text-white">Audit Log</h1>
      <p className="mt-1.5 text-sm text-white/45">
        200 catatan terakhir. Bersifat hanya-tambah: tidak ada peran yang bisa mengubah atau
        menghapusnya dari dalam aplikasi.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-white/35">Belum ada catatan.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[44rem] text-left text-xs">
            <thead className="bg-white/[0.04] text-white/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">Waktu</th>
                <th scope="col" className="px-4 py-3 font-normal">Pelaku</th>
                <th scope="col" className="px-4 py-3 font-normal">Aksi</th>
                <th scope="col" className="px-4 py-3 font-normal">Objek</th>
                <th scope="col" className="px-4 py-3 font-normal">Nilai baru</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id} className="border-t border-white/10 align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 text-white/60">
                    {new Date(entry.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2.5 text-white/70">
                    {entry.name || entry.email || "—"}
                    {entry.ip ? <span className="block text-white/30">{entry.ip}</span> : null}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-white/80">{entry.action}</td>
                  <td className="px-4 py-2.5 text-white/55">
                    {entry.entity}
                    {entry.entity_id ? (
                      <span className="block text-white/30">{entry.entity_id}</span>
                    ) : null}
                  </td>
                  <td className="max-w-xs px-4 py-2.5 text-white/45">
                    {entry.new_value ? (
                      <code className="break-all">{JSON.stringify(entry.new_value)}</code>
                    ) : (
                      "—"
                    )}
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
