import { NextResponse } from "next/server";

import { getSql, hasDatabase } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { bookingCode, normalizeWhatsapp, validateReservation } from "@/lib/validate";
import { clientIp, tooMany } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        message:
          "Reservasi belum tersambung ke basis data. Sementara ini hubungi kami di hello@hololabs.id.",
      },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const errors = validateReservation(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: "Ada isian yang belum benar.", errors }, { status: 422 });
  }

  const sql = getSql()!;
  const whatsapp = normalizeWhatsapp(String(body.whatsapp));

  // PRD bagian 11: 5 per jam per IP.
  const blocked = await tooMany(sql, [
    { table: "bookings", column: "source_ip", value: ip, minutes: 60, limit: 5 },
  ]);
  if (blocked) {
    return NextResponse.json(
      { message: "Terlalu banyak percobaan reservasi. Coba lagi satu jam lagi." },
      { status: 429 },
    );
  }

  const code = bookingCode();

  try {
    const rows = (await sql`
      insert into bookings (code, name, whatsapp, email, people, visitor_type, preferred_date, note, source_ip)
      values (
        ${code},
        ${String(body.name).trim()},
        ${whatsapp},
        ${String(body.email ?? "").trim()},
        ${Number(body.people)},
        ${String(body.visitorType)},
        ${String(body.preferredDate)},
        ${String(body.note ?? "").trim()},
        ${ip}
      )
      returning id, code
    `) as { id: string; code: string }[];

    await recordAudit({
      action: "BOOKING_CREATED",
      entity: "bookings",
      entityId: rows[0].id,
      newValue: { code: rows[0].code, people: Number(body.people) },
      ip,
    });

    return NextResponse.json({
      message: `Reservasi tercatat. Kode booking kamu ${rows[0].code}. Kami konfirmasi lewat WhatsApp.`,
      code: rows[0].code,
    });
  } catch (error) {
    // Batas tiga booking aktif ditegakkan trigger basis data, bukan aplikasi,
    // supaya dua permintaan bersamaan tidak bisa menembusnya.
    if (error instanceof Error && error.message.includes("BOOKING_LIMIT")) {
      return NextResponse.json(
        { message: "Nomor ini sudah punya 3 reservasi aktif. Selesaikan dulu salah satunya." },
        { status: 409 },
      );
    }
    console.error("[reservation] gagal", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menyimpan. Coba lagi sebentar lagi." },
      { status: 500 },
    );
  }
}
