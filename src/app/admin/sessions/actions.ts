"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { getSql } from "@/lib/db/client";

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

  const sql = getSql();
  const clash = await sql`
    select 1 from sessions
    where session_date = ${date}::date
      and start_time < ${slot.endTime}::time and end_time > ${slot.startTime}::time
    limit 1
  `;
  if (clash.length > 0) done("Jam sesi bertabrakan dengan sesi lain di tanggal yang sama.", "error");

  await sql`
    insert into sessions (session_date, slot_index, start_time, end_time, capacity)
    values (
      ${date}::date,
      1000 + (select count(*) from sessions where session_date = ${date}::date),
      ${slot.startTime}::time, ${slot.endTime}::time, ${slot.capacity}
    )
  `;
  await sql`select renumber_session_slots(${date}::date)`;
  done("Sesi ditambahkan.");
}

/** Add a whole day using the same show times as the latest existing day. */
export async function createDayFromTemplate(formData: FormData): Promise<void> {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  if (!DATE.test(date)) done("Tanggal wajib diisi.", "error");

  const sql = getSql();
  const exists = await sql`select 1 from sessions where session_date = ${date}::date limit 1`;
  if (exists.length > 0) done("Tanggal itu sudah punya sesi. Tambahkan sesi satu per satu di bawah.", "error");

  const template = await sql`
    select start_time::text as start_time, end_time::text as end_time, capacity
    from sessions
    where session_date = (select max(session_date) from sessions)
    order by slot_index
  `;
  const slots =
    template.length > 0
      ? template
      : [
          { start_time: "18:00", end_time: "19:30", capacity: 13 },
          { start_time: "19:30", end_time: "21:00", capacity: 13 },
        ];

  for (const [i, s] of slots.entries()) {
    await sql`
      insert into sessions (session_date, slot_index, start_time, end_time, capacity)
      values (${date}::date, ${i}, ${s.start_time}::time, ${s.end_time}::time, ${s.capacity})
    `;
  }
  done(`${slots.length} sesi ditambahkan untuk tanggal baru.`);
}

export async function updateSession(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("sessionId") ?? "");
  const slot = readSlot(formData);
  if ("error" in slot) done(slot.error!, "error");

  const sql = getSql();
  const [current] = await sql`select session_date::text as session_date, seats_taken from sessions where id = ${id}::uuid`;
  if (!current) done("Sesi tidak ditemukan.", "error");
  if (slot.capacity < current.seats_taken) {
    done(`Kapasitas tidak bisa di bawah ${current.seats_taken} kursi yang sudah terisi.`, "error");
  }
  const clash = await sql`
    select 1 from sessions
    where session_date = ${current.session_date}::date and id <> ${id}::uuid
      and start_time < ${slot.endTime}::time and end_time > ${slot.startTime}::time
    limit 1
  `;
  if (clash.length > 0) done("Jam sesi bertabrakan dengan sesi lain di tanggal yang sama.", "error");

  await sql`
    update sessions
    set start_time = ${slot.startTime}::time, end_time = ${slot.endTime}::time, capacity = ${slot.capacity}
    where id = ${id}::uuid
  `;
  await sql`select renumber_session_slots(${current.session_date}::date)`;
  done("Sesi diperbarui.");
}

/** Only sessions that never had a booking can be deleted; bookings keep their history. */
export async function deleteSession(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("sessionId") ?? "");
  const sql = getSql();
  const used = await sql`
    select 1 from bookings where session_id = ${id}::uuid or requested_session_id = ${id}::uuid limit 1
  `;
  if (used.length > 0) {
    done("Sesi ini sudah punya booking, jadi tidak bisa dihapus. Batalkan booking-nya dulu atau ubah kapasitasnya.", "error");
  }
  const [row] = await sql`delete from sessions where id = ${id}::uuid returning session_date::text as session_date`;
  if (row) await sql`select renumber_session_slots(${row.session_date}::date)`;
  done("Sesi dihapus.");
}
