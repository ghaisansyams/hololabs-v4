import Link from "next/link";
import { AdminHeader, StatusPill, paymentTone } from "@/components/admin/page-header";
import { Check } from "lucide-react";
import { BookingDetailModal } from "@/components/admin/booking-detail-modal";
import { EditBookingDialog } from "@/components/admin/edit-booking-dialog";
import { PaymentFlowDialog } from "@/components/admin/payment-flow-dialog";
import { SendChangeButton } from "@/components/admin/send-change-button";
import { TicketSentChips } from "@/components/admin/ticket-delivery";
import { cancelBooking, checkInBooking } from "../actions";
import { emailConfigured } from "@/lib/services/mailer";
import { listBookings, type AdminBookingRow, type BookingFilter } from "@/lib/services/admin";
import { formatDate, formatDayMonth } from "@/lib/utils/date";
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
  const emailReady = emailConfigured();

  const statusOf = (b: AdminBookingRow) =>
    b.status === "CANCELLED" ? "Dibatalkan" : b.paymentStatus === "PAID" ? "Lunas" : b.paymentStatus === "SUBMITTED" ? "Menunggu konfirmasi" : "Belum transfer";
  const StatusCell = ({ b, row }: { b: AdminBookingRow; row?: boolean }) => (
    <div className={cn("flex items-center gap-x-2.5 gap-y-1", row && !b.changePending ? "flex-nowrap" : "flex-wrap")}>
      <StatusPill tone={paymentTone(b.status === "CANCELLED" ? "CANCELLED" : b.paymentStatus)}>{statusOf(b)}</StatusPill>
      {b.checkinStatus === "CHECKED_IN" && b.status !== "CANCELLED" ? (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-success">
          <Check className="size-3.5" aria-hidden />
          {row ? "Check-in" : "Sudah check-in"}
        </span>
      ) : null}
      {b.changePending && b.status !== "CANCELLED" ? <StatusPill tone="accent">Perubahan belum dikirim</StatusPill> : null}
    </div>
  );
  const ActionsCell = ({ b, row }: { b: AdminBookingRow; row?: boolean }) => (
    <div className={cn("flex items-center justify-end gap-1.5", row ? "flex-nowrap" : "flex-wrap")}>
      {b.status !== "CANCELLED" ? <PaymentFlowDialog booking={b} emailReady={emailReady} /> : null}
      <SendChangeButton booking={b} emailReady={emailReady} />
      <BookingDetailModal booking={b} emailReady={emailReady} checkInBooking={checkInBooking} cancelBooking={cancelBooking} />
    </div>
  );
  const canEdit = (b: AdminBookingRow) => b.status !== "CANCELLED" && b.checkinStatus !== "CHECKED_IN";
  const withEdit = (b: AdminBookingRow, what: string, children: React.ReactNode) =>
    canEdit(b) ? (
      <div className="flex items-start gap-2">
        <div>{children}</div>
        <EditBookingDialog booking={b} emailReady={emailReady} what={what} className="mt-0.5" />
      </div>
    ) : (
      children
    );
  const seatText = (b: AdminBookingRow) => (b.seatLabels?.length ? `No. ${b.seatLabels.join(", ")}` : `${b.seats} kursi`);

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

      {/* Wide screens: one row per booking, one status pill, e-ticket icons in their own column. */}
      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface xl:block">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-2 py-3 font-semibold">Pemesan</th>
              <th className="px-2 py-3 font-semibold">Sesi</th>
              <th className="px-2 py-3 font-semibold">Kursi</th>
              <th className="px-2 py-3 font-semibold">Total</th>
              <th className="px-2 py-3 font-semibold">Status</th>
              <th className="whitespace-nowrap px-2 py-3 font-semibold">E-ticket</th>
              <th className="px-3 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  Tidak ada booking untuk filter ini.
                </td>
              </tr>
            ) : null}
            {rows.map((b) => {
              const cancelled = b.status === "CANCELLED";
              return (
                <tr key={b.id} className={cn("align-middle", cancelled && "opacity-60")}>
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap font-semibold text-ink">{b.bookingNumber}</p>
                    <p className="text-xs text-muted">{b.createdAt.slice(0, 16).replace("T", " ")}</p>
                    {b.autoRouted ? (
                      <span className="mt-1 inline-flex">
                        <StatusPill tone="accent">Auto-routed</StatusPill>
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-semibold text-ink">{b.customerName}</p>
                    <p className="text-xs text-muted">{b.whatsapp}</p>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-ink-soft">
                    {withEdit(
                      b,
                      "jadwal",
                      <>
                        {formatDayMonth(b.sessionDate)} {b.sessionDate.slice(0, 4)}
                        <br />
                        <span className="text-xs text-muted">
                          {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)} WIB
                        </span>
                      </>,
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-ink-soft">
                    {withEdit(
                      b,
                      "kursi",
                      <>
                        {seatText(b)}
                        <br />
                        <span className="text-xs text-muted">{b.seatLabels?.length ? `${b.seats} orang` : b.packageName}</span>
                      </>,
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 font-semibold text-ink">{formatRupiah(b.amount)}</td>
                  <td className="px-2 py-3">
                    <StatusCell b={b} row />
                  </td>
                  <td className="px-2 py-3">
                    <TicketSentChips booking={b} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <ActionsCell b={b} row />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phones, tablets and small laptops: one card per booking. */}
      <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
        {rows.length === 0 ? <li className="rounded-card border border-line bg-surface px-4 py-10 text-center text-muted">Tidak ada booking untuk filter ini.</li> : null}
        {rows.map((b) => (
          <li key={b.id} className={cn("rounded-card border border-line bg-surface p-4", b.status === "CANCELLED" && "opacity-60")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{b.bookingNumber}</p>
                <p className="text-xs text-muted">{b.createdAt.slice(0, 16).replace("T", " ")}</p>
              </div>
              <StatusCell b={b} />
            </div>
            <p className="mt-3 font-semibold text-ink">{b.customerName}</p>
            <p className="text-xs text-muted">{b.whatsapp}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted">Sesi</dt>
                <dd className="text-ink-soft">
                  {withEdit(
                    b,
                    "jadwal",
                    <>
                      {formatDate(b.sessionDate)}
                      <br />
                      <span className="text-xs text-muted">
                        {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)} WIB
                      </span>
                    </>,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Kursi</dt>
                <dd className="text-ink-soft">{withEdit(b, "kursi", seatText(b))}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Total</dt>
                <dd className="font-semibold text-ink">{formatRupiah(b.amount)}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-muted">E-ticket</dt>
                <dd>
                  <TicketSentChips booking={b} />
                </dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-line pt-3">
              <ActionsCell b={b} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
