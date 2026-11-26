import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/admin/session";
import { listCustomers } from "@/lib/services/admin";
import { logActivity } from "@/lib/services/activity-log";

export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  if (!(await isValidSessionToken((await cookies()).get(ADMIN_COOKIE)?.value))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const rows = await listCustomers("", 0);
  await logActivity({ category: "Ekspor", action: "Ekspor CSV pelanggan", detail: `${rows.length} baris` });
  const header = ["nama", "whatsapp", "email", "terdaftar", "jumlah_booking", "jumlah_kursi", "total_lunas", "show_terakhir"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.fullName, r.whatsapp, r.email, r.createdAt, r.bookingCount, r.seatCount, r.paidTotal, r.lastShowDate ?? ""].map(csvCell).join(","),
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pelanggan-hololabs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
