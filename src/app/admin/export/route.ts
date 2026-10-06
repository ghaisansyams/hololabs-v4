import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/admin/session";
import { allBookingsForExport } from "@/lib/services/admin";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  if (!(await isValidSessionToken((await cookies()).get(ADMIN_COOKIE)?.value))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const rows = await allBookingsForExport();
  const header = [
    "booking_number", "created_at", "customer_name", "whatsapp", "email",
    "session_date", "start_time", "end_time", "package", "seats", "amount",
    "payment_status", "checkin_status", "auto_routed",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.bookingNumber, r.createdAt, r.customerName, r.whatsapp, r.email,
        r.sessionDate, r.startTime, r.endTime, r.packageName, r.seats, r.amount,
        r.paymentStatus, r.checkinStatus, r.autoRouted,
      ].map(csvCell).join(","),
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-holomoc-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
