"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { and, asc, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import { getDb, rows, schema } from "@/lib/db/client";

const { sessions, bookings } = schema;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function done(message: string, tone: "ok" | "error" = "ok"): never {
  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/pesan");
  revalidatePath("/", "layout");
  redirect(`/admin/sessions?${tone}=${encodeURIComponent(message)}`);
}

function readSlot(formData: FormData) {
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const capacity = Number(formData.get("capacity") ?? 0);
  if (!TIME.test(startTime) || !TIME.test(endTime)) return { error: "Jam mulai dan selesai wajib diisi." };
  if (endTime <= startTime) return { error: "Jam selesai harus setelah jam mulai." };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
    return { error: "Kapasitas harus angka 1–500." };
  }
  return { startTime, endTime, capacity };
}

/** Add one show on a date. */
export async function createSession(formData: FormData): Promise<void> {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  if (!DATE.test(date)) done("Tanggal wajib diisi.", "error");
  const slot = readSlot(formData);
  if ("error" in slot) done(slot.error!, "error");

  const db = getDb();
  const clash = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.sessionDate, date), lt(sessions.startTime, slot.endTime), gt(sessions.endTime, slot.startTime)))
    .limit(1);
  if (clash.length > 0) done("Jam sesi bertabrakan dengan sesi lain di tanggal yang sama.", "error");

  // slot_index is a temporary high number; renumber_session_slots puts the
  // day's shows back in time order straight after.
  await db.insert(sessions).values({
    sessionDate: date,
    slotIndex: sql`1000 + (select count(*) from sessions where session_date = ${date}::date)`,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: slot.capacity,
  });
  await rows(sql`select renumber_session_slots(${date}::date)`);
  done("Sesi ditambahkan.");
}

/** Add a whole day using the same show times as the latest existing day. */
export async function createDayFromTemplate(formData: FormData): Promise<void> {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  if (!DATE.test(date)) done("Tanggal wajib diisi.", "error");

  const db = getDb();
  const exists = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.sessionDate, date)).limit(1);
  if (exists.length > 0) done("Tanggal itu sudah punya sesi. Tambahkan sesi satu per satu di bawah.", "error");

  const template = await db
    .select({ startTime: sessions.startTime, endTime: sessions.endTime, capacity: sessions.capacity })
    .from(sessions)
    .where(eq(sessions.sessionDate, sql`(select max(session_date) from sessions)`))
    .orderBy(asc(sessions.slotIndex));
  const slots =
    template.length > 0
      ? template
      : [
          { startTime: "18:00", endTime: "19:30", capacity: 13 },
          { startTime: "19:30", endTime: "21:00", capacity: 13 },
        ];

  await db.insert(sessions).values(
    slots.map((s, i) => ({
      sessionDate: date,
      slotIndex: i,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
    })),
  );
  done(`${slots.length} sesi ditambahkan untuk tanggal baru.`);
}

export async function updateSession(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("sessionId") ?? "");
  const slot = readSlot(formData);
  if ("error" in slot) done(slot.error!, "error");

  const db = getDb();
  const [current] = await db
    .select({ sessionDate: sessions.sessionDate, seatsTaken: sessions.seatsTaken })
    .from(sessions)
    .where(eq(sessions.id, id));
  if (!current) done("Sesi tidak ditemukan.", "error");
  if (slot.capacity < current.seatsTaken) {
    done(`Kapasitas tidak bisa di bawah ${current.seatsTaken} kursi yang sudah terisi.`, "error");
  }
  const clash = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.sessionDate, current.sessionDate),
        ne(sessions.id, id),
        lt(sessions.startTime, slot.endTime),
        gt(sessions.endTime, slot.startTime),
      ),
    )
    .limit(1);
  if (clash.length > 0) done("Jam sesi bertabrakan dengan sesi lain di tanggal yang sama.", "error");

  await db
    .update(sessions)
    .set({ startTime: slot.startTime, endTime: slot.endTime, capacity: slot.capacity })
    .where(eq(sessions.id, id));
  await rows(sql`select renumber_session_slots(${current.sessionDate}::date)`);
  done("Sesi diperbarui.");
}

/** Only sessions that never had a booking can be deleted; bookings keep their history. */
export async function deleteSession(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("sessionId") ?? "");
  const db = getDb();
  const used = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(or(eq(bookings.sessionId, id), eq(bookings.requestedSessionId, id)))
    .limit(1);
  if (used.length > 0) {
    done("Sesi ini sudah punya booking, jadi tidak bisa dihapus. Batalkan booking-nya dulu atau ubah kapasitasnya.", "error");
  }
  const [row] = await db.delete(sessions).where(eq(sessions.id, id)).returning({ sessionDate: sessions.sessionDate });
  if (row) await rows(sql`select renumber_session_slots(${row.sessionDate}::date)`);
  done("Sesi dihapus.");
}
