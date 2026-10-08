import { NextResponse } from "next/server";

import { getSql, hasDatabase } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { bookingCode, normalizeWhatsapp, validateReservation } from "@/lib/validate";
import { clientIp, tooMany } from "@/lib/rate-limit";

export interface ReservationResult {
  code: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  packageName: string;
  seats: number;
  amount: number;
  autoRouted: boolean;
}

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
    return NextResponse.json({ message: "Periksa kembali isian yang ditandai.", errors }, { status: 422 });
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

  try {
    // Sesi akhir, harga, dan total ditentukan basis data (auto-routing +
    // harga dari tabel packages), bukan dari angka yang dikirim browser.
    const rows = await sql`
      select * from create_show_booking(
        ${bookingCode()},
        ${String(body.name).trim()},
        ${whatsapp},
        ${String(body.email ?? "").trim()},
        ${String(body.sessionId)}::uuid,
        ${String(body.packageId)},
        ${Number(body.seats)},
        ${String(body.note ?? "").trim()},
        ${ip}
      )
    `;
    const row = rows[0];

    await recordAudit({
      action: "BOOKING_CREATED",
      entity: "bookings",
      entityId: row.id,
      newValue: { code: row.code, seats: row.seats, package: row.package_name, amount: Number(row.amount) },
      ip,
    });

    const result: ReservationResult = {
      code: row.code,
      sessionDate: row.session_date,
      startTime: row.start_time,
      endTime: row.end_time,
      packageName: row.package_name,
      seats: Number(row.seats),
      amount: Number(row.amount),
      autoRouted: Boolean(row.auto_routed),
    };
    return NextResponse.json({ message: `Booking ${row.code} tercatat.`, booking: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Batas tiga booking aktif ditegakkan trigger basis data, bukan aplikasi,
    // supaya dua permintaan bersamaan tidak bisa menembusnya.
    if (message.includes("BOOKING_LIMIT")) {
      return NextResponse.json(
        { message: "Nomor ini sudah punya 3 reservasi aktif. Selesaikan dulu salah satunya." },
        { status: 409 },
      );
    }
    if (message.includes("NO_AVAILABILITY")) {
      return NextResponse.json(
        {
          message:
            "Tidak ada sesi dengan kursi cukup untuk jumlah yang diminta, termasuk sesi berikutnya. Coba kurangi jumlah kursi atau pilih tanggal lain.",
        },
        { status: 409 },
      );
    }
    if (message.includes("PACKAGE_NOT_FOUND") || message.includes("SESSION_NOT_FOUND")) {
      return NextResponse.json(
        { message: "Sesi atau paket yang dipilih tidak tersedia. Muat ulang halaman lalu pilih lagi." },
        { status: 422 },
      );
    }
    console.error("[reservation] gagal", error);
    return NextResponse.json(
      { message: "Gagal membuat booking. Coba lagi sebentar lagi." },
      { status: 500 },
    );
  }
}
