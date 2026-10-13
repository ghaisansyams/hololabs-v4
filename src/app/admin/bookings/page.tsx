import Link from "next/link";
import { AdminHeader, StatusPill, paymentTone } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { BookingDetailModal } from "@/components/admin/booking-detail-modal";
import { cancelBooking, checkInBooking, markBookingPaid } from "../actions";
import { listBookings, type BookingFilter } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils/date";
import { formatRupiah } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

const FILTERS: { value: BookingFilter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Belum transfer" },
  { value: "SUBMITTED", label: "Menunggu konfirmasi" },
  { value: "PAID", label: "Lunas" },
  { value: "CHECKED_IN", label: "Sudah check-in" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

function parseFilter(value: string | undefined): BookingFilter {
  return FILTERS.some((f) => f.value === value) ? (value as BookingFilter) : "ALL";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q = "" } = await searchParams;
  const filter = parseFilter(status);
  const rows = await listBookings(filter, q);

  return (
    <>
      <AdminHeader
        title="Booking"
        description="Verifikasi transfer, check-in, dan pembatalan. Pembatalan otomatis mengembalikan kursi ke sesi."
        action={
          <a
            href="/admin/export"
            className="rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink"
          >
            Export CSV
          </a>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/bookings?status=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "shrink-0 rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                filter === f.value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-soft hover:border-accent/40",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form action="/admin/bookings" className="flex gap-2">
          <input type="hidden" name="status" value={filter} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nomor booking, nama, WA"
            className="h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent sm:w-72"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-4 py-3 font-semibold">Pemesan</th>
              <th className="px-4 py-3 font-semibold">Sesi</th>
              <th className="px-4 py-3 font-semibold">Paket · Kursi</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Tidak ada booking untuk filter ini.
                </td>
              </tr>
            ) : null}
            {rows.map((b) => {
              const cancelled = b.status === "CANCELLED";
              return (
                <tr key={b.id} className={cn("align-top", cancelled && "opacity-55")}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{b.bookingNumber}</p>
                    <p className="text-xs text-muted">{b.createdAt.slice(0, 16).replace("T", " ")}</p>
                    {b.autoRouted ? <StatusPill tone="accent">Auto-routed</StatusPill> : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{b.customerName}</p>
                    <p className="text-xs text-muted">{b.whatsapp}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatDate(b.sessionDate)}
                    <br />
                    <span className="text-xs text-muted">
                      {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)} WIB
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {b.packageName}
                    <br />
                    <span className="text-xs text-muted">{b.seats} kursi</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatRupiah(b.amount)}</td>
                  <td className="px-4 py-3 space-y-1.5">
                    <StatusPill tone={paymentTone(b.paymentStatus)}>
                      {cancelled
                        ? "Dibatalkan"
                        : b.paymentStatus === "PAID"
                          ? "Lunas"
                          : b.paymentStatus === "SUBMITTED"
                            ? "Menunggu konfirmasi"
                            : "Belum transfer"}
                    </StatusPill>
                    {b.checkinStatus === "CHECKED_IN" ? <StatusPill tone="success">Check-in</StatusPill> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <BookingDetailModal
                        booking={b}
                        markBookingPaid={markBookingPaid}
                        checkInBooking={checkInBooking}
                        cancelBooking={cancelBooking}
                      />
                    </div>
                    {!cancelled ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {b.paymentStatus !== "PAID" ? (
                          <form action={markBookingPaid}>
                            <input type="hidden" name="bookingId" value={b.id} />
                            <ConfirmButton message={`Tandai ${b.bookingNumber} sebagai LUNAS?`}>
                              {b.paymentStatus === "SUBMITTED" ? "Konfirmasi pembayaran" : "Tandai lunas"}
                            </ConfirmButton>
                          </form>
                        ) : null}
                        {b.paymentStatus === "PAID" && b.checkinStatus !== "CHECKED_IN" ? (
                          <form action={checkInBooking}>
                            <input type="hidden" name="bookingId" value={b.id} />
                            <ConfirmButton message={`Check-in ${b.bookingNumber}?`}>Check-in</ConfirmButton>
                          </form>
                        ) : null}
                        <form action={cancelBooking}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          <ConfirmButton
                            tone="danger"
                            message={`Batalkan ${b.bookingNumber}? Kursi ${b.seats} akan dikembalikan ke sesi.`}
                          >
                            Batalkan
                          </ConfirmButton>
                        </form>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
