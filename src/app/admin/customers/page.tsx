import Link from "next/link";
import { Search } from "lucide-react";
import { AdminHeader } from "@/components/admin/page-header";
import { listCustomers, type CustomerRow } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils/date";
import { formatRupiah } from "@/lib/utils/format";
import { toWhatsappE164 } from "@/lib/utils/phone";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pelanggan" };

const waLink = (c: CustomerRow) => `https://wa.me/${toWhatsappE164(c.whatsapp)}`;
const bookingsLink = (c: CustomerRow) => `/admin/bookings?q=${encodeURIComponent(c.whatsapp)}`;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const customers = await listCustomers(q);
  const repeat = customers.filter((c) => c.bookingCount > 1).length;
  const revenue = customers.reduce((sum, c) => sum + c.paidTotal, 0);

  return (
    <>
      <AdminHeader
        title="Pelanggan"
        description="Data pemesan: kontak, jumlah booking, kursi, total yang sudah lunas, dan show terakhir. Dari sini bisa langsung chat WhatsApp atau melihat booking mereka."
        action={
          <a
            href="/admin/export/customers"
            className="rounded-pill border border-line px-4 py-2 text-center text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink"
          >
            Export CSV
          </a>
        }
      />

      <dl className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          [q ? "Hasil pencarian" : "Total pelanggan", String(customers.length)],
          ["Pesan lebih dari sekali", String(repeat)],
          ["Total lunas", formatRupiah(revenue)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-card border border-line bg-surface p-3 sm:p-4">
            <dt className="text-[0.625rem] font-semibold uppercase leading-tight tracking-wide text-muted sm:text-xs">{label}</dt>
            <dd className="mt-1 text-lg font-extrabold text-ink sm:text-2xl">{value}</dd>
          </div>
        ))}
      </dl>

      <form action="/admin/customers" className="mb-5 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Cari pelanggan</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama, WhatsApp, atau email"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
        <button type="submit" className="h-11 rounded-xl bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/20">
          Cari
        </button>
        {q ? (
          <Link href="/admin/customers" className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold text-ink-soft">
            Reset
          </Link>
        ) : null}
      </form>

      {customers.length === 0 ? (
        <p className="rounded-card border border-line bg-surface px-4 py-10 text-center text-muted">
          {q ? "Tidak ada pelanggan yang cocok." : "Belum ada pelanggan."}
        </p>
      ) : (
        <>
          {/* Phones and small tablets: one card per customer. */}
          <ul className="grid gap-3 md:hidden">
            {customers.map((c) => (
              <li key={c.id} className="rounded-card border border-line bg-surface p-4">
                <p className="font-bold text-ink">{c.fullName}</p>
                <p className="mt-0.5 break-all text-sm text-muted">{c.email || "Tanpa email"}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Booking</dt>
                    <dd className="font-semibold text-ink">{c.bookingCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Kursi</dt>
                    <dd className="font-semibold text-ink">{c.seatCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Lunas</dt>
                    <dd className="font-semibold text-ink">{formatRupiah(c.paidTotal)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-muted">
                  Show terakhir: {c.lastShowDate ? formatDate(c.lastShowDate) : "—"}
                </p>
                <div className="mt-3 flex gap-2 text-sm font-semibold">
                  <a href={waLink(c)} target="_blank" rel="noopener noreferrer" className="rounded-pill bg-success-soft px-3.5 py-2 text-success">
                    WhatsApp {c.whatsapp}
                  </a>
                  <Link href={bookingsLink(c)} className="rounded-pill border border-line px-3.5 py-2 text-ink-soft">
                    Booking
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">WhatsApp</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Booking</th>
                  <th className="px-4 py-3 font-semibold">Kursi</th>
                  <th className="px-4 py-3 font-semibold">Total lunas</th>
                  <th className="px-4 py-3 font-semibold">Show terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{c.fullName}</td>
                    <td className="px-4 py-3">
                      <a href={waLink(c)} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {c.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{c.email || "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={bookingsLink(c)} className="font-semibold text-accent hover:underline">
                        {c.bookingCount}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{c.seatCount}</td>
                    <td className="px-4 py-3 text-ink">{formatRupiah(c.paidTotal)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{c.lastShowDate ? formatDate(c.lastShowDate) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
