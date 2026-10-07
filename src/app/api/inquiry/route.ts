import { NextResponse } from "next/server";

import { getSql, hasDatabase } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { normalizeWhatsapp, validateInquiry } from "@/lib/validate";
import { clientIp, tooMany } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        message:
          "Form belum tersambung ke basis data. Sementara ini kirim langsung ke hello@hololabs.id.",
      },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const errors = validateInquiry(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { message: "Ada isian yang belum benar.", errors },
      { status: 422 },
    );
  }

  const sql = getSql()!;
  const email = String(body.email).toLowerCase().trim();

  // PRD bagian 11: 3 per 10 menit per IP, 5 per hari per alamat email.
  const blocked = await tooMany(sql, [
    { table: "leads", column: "source_ip", value: ip, minutes: 10, limit: 3 },
    { table: "leads", column: "email", value: email, minutes: 1440, limit: 5 },
  ]);
  if (blocked) {
    return NextResponse.json(
      { message: "Terlalu banyak pengiriman. Coba lagi nanti atau hubungi kami langsung." },
      { status: 429 },
    );
  }

  const services = (body.services as string[]).map(String);

  const rows = (await sql`
    insert into leads (name, company, role, email, whatsapp, services, event_date, budget, message, source_ip)
    values (
      ${String(body.name).trim()},
      ${String(body.company ?? "").trim()},
      ${String(body.role ?? "").trim()},
      ${email},
      ${normalizeWhatsapp(String(body.whatsapp))},
      ${services},
      ${body.eventDate ? String(body.eventDate) : null},
      ${String(body.budget)},
      ${String(body.message).trim()},
      ${ip}
    )
    returning id
  `) as { id: string }[];

  await recordAudit({
    action: "LEAD_CREATED",
    entity: "leads",
    entityId: rows[0].id,
    newValue: { email, services },
    ip,
  });

  // Notifikasi email dan WhatsApp (PRD bagian 8) menunggu kredensial Resend
  // dan Fonnte. Sampai itu ada, lead tetap aman tersimpan dan terlihat di
  // dashboard admin, jadi tidak ada yang hilang.

  return NextResponse.json({
    message: "Terima kasih. Tim kami akan menghubungi dalam 1×24 jam kerja.",
  });
}
