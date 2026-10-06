import { AdminHeader } from "@/components/admin/page-header";
import { listCustomers } from "@/lib/services/admin";
import { formatRupiah } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();
  return (
    <>
      <AdminHeader title="Pelanggan" description="Pemesan yang sudah pernah mendaftar, dengan total booking dan nilai lunas." />
      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">WhatsApp</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-4 py-3 font-semibold">Total lunas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Belum ada pelanggan.
                </td>
              </tr>
            ) : null}
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-semibold text-ink">{c.fullName}</td>
                <td className="px-4 py-3 text-ink-soft">{c.whatsapp}</td>
                <td className="px-4 py-3 text-ink-soft">{c.email || "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{c.bookingCount}</td>
                <td className="px-4 py-3 text-ink">{formatRupiah(c.paidTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
