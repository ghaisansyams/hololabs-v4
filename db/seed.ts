/**
 * Data seeder for the booking engine (Drizzle + plain Postgres).
 *
 *   npm run db:seed                  packages + the next 5 days of shows
 *   npm run db:seed -- --days=10     ...next 10 days instead
 *   npm run db:seed -- --demo        also add demo customers and bookings in
 *                                    every status, so /admin has data to show
 *   npm run db:seed -- --clean-demo  remove that demo data again
 *
 * Safe to re-run: packages and sessions that already exist are left alone
 * (the admin panel owns them after the first seed), and demo data is only
 * added once. Run db/schema.sql first; DATABASE_URL comes from .env.local
 * or the environment. Demo bookings go through the same SQL functions the
 * website uses (create_booking, admin_mark_paid, ...), so seat counts and
 * booking numbers stay consistent.
 */
import { and, asc, gte, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, types } from "pg";
import * as schema from "../src/lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diisi (.env.local atau environment).");
  process.exit(1);
}

for (const oid of [1082, 1083, 1114, 1184]) types.setTypeParser(oid, (value) => value);

const host = new URL(url).hostname;
const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
const pool = new Pool({ connectionString: url, max: 2, ssl: local ? undefined : { rejectUnauthorized: false } });
const db = drizzle(pool, { schema });
const { packages, sessions, customers, bookings, payments } = schema;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const daysArg = args.find((a) => a.startsWith("--days="));
const days = daysArg ? Math.max(1, Math.min(60, Number(daysArg.split("=")[1]) || 5)) : 5;

const DEMO_EMAIL_SUFFIX = "@demo.hololabs.local";

const run = async <T = Record<string, unknown>>(q: ReturnType<typeof sql>) => (await db.execute(q)).rows as T[];

async function seedPackages() {
  const inserted = await db
    .insert(packages)
    .values([
      {
        id: "seat-only",
        name: "Seat Only",
        description: "Masuk pameran dan kursi tereservasi, tanpa paket F&B.",
        includes: ["Akses show 1,5 jam", "Kursi tereservasi"],
        price: "75000",
        sortOrder: 1,
      },
      {
        id: "standard",
        name: "Standard F&B",
        description: "Kursi tereservasi plus satu paket makanan & minuman ringan.",
        includes: ["Akses show 1,5 jam", "Kursi tereservasi", "1 pilihan makanan (dimsum/tahu)", "1 pilihan minuman"],
        price: "150000",
        sortOrder: 2,
      },
      {
        id: "premium",
        name: "Premium F&B",
        description: "Pengalaman lengkap: kursi terbaik dan sajian F&B tanpa batas selama sesi.",
        includes: ["Akses show 1,5 jam", "Kursi prioritas", "Aneka makanan (dimsum, tahu, camilan lain)", "Minuman bebas pilih & refill"],
        price: "250000",
        sortOrder: 3,
      },
    ])
    .onConflictDoNothing()
    .returning({ id: packages.id });
  console.log(`Paket: ${inserted.length} baru (yang sudah ada tidak diubah).`);
}

async function seedSessions() {
  const rows = await run<{ session_date: string }>(sql`
    insert into sessions (session_date, slot_index, start_time, end_time, capacity)
    select d::date, t.slot, t.start_time, t.end_time, 13
    from generate_series(current_date + 1, current_date + ${days}::int, interval '1 day') as d
    cross join (values (0, '18:00'::time, '19:30'::time), (1, '19:30'::time, '21:00'::time)) as t(slot, start_time, end_time)
    on conflict (session_date, slot_index) do nothing
    returning session_date::text
  `);
  console.log(`Sesi: ${rows.length} baru untuk ${days} hari ke depan (2 show per hari, 13 kursi).`);
}

type Outcome = "PENDING" | "SUBMITTED" | "PAID" | "CHECKED_IN" | "CANCELLED";
const DEMO: { name: string; email: string; pkg: string; seats: number; outcome: Outcome }[] = [
  { name: "Budi Santoso", email: "budi", pkg: "seat-only", seats: 2, outcome: "PENDING" },
  { name: "Siti Rahma", email: "siti", pkg: "standard", seats: 3, outcome: "SUBMITTED" },
  { name: "Andi Wijaya", email: "andi", pkg: "premium", seats: 2, outcome: "PAID" },
  { name: "Dewi Lestari", email: "dewi", pkg: "standard", seats: 4, outcome: "CHECKED_IN" },
  { name: "Rizky Pratama", email: "rizky", pkg: "seat-only", seats: 1, outcome: "CANCELLED" },
  { name: "Maya Anggraini", email: "maya", pkg: "standard", seats: 2, outcome: "PAID" },
  { name: "Fajar Nugroho", email: "fajar", pkg: "seat-only", seats: 5, outcome: "SUBMITTED" },
  { name: "Putri Ayu", email: "putri", pkg: "premium", seats: 1, outcome: "PENDING" },
];

async function seedDemo() {
  const existing = await db.select({ id: customers.id }).from(customers).where(like(customers.email, `%${DEMO_EMAIL_SUFFIX}`)).limit(1);
  if (existing.length > 0) {
    console.log("Data demo sudah ada — dilewati. Hapus dulu dengan --clean-demo kalau ingin membuat ulang.");
    return;
  }
  const slots = await db.select().from(sessions).where(gte(sessions.sessionDate, sql`current_date`)).orderBy(asc(sessions.sessionDate), asc(sessions.slotIndex)).limit(4);
  const prices = new Map((await db.select().from(packages)).map((p) => [p.id, Number(p.price)]));
  if (slots.length === 0 || prices.size === 0) {
    console.error("Belum ada sesi/paket — jalankan seeder tanpa --demo dulu.");
    process.exit(1);
  }

  for (const [i, d] of DEMO.entries()) {
    const whatsapp = `0812000000${String(i + 1).padStart(2, "0")}`;
    const amount = (prices.get(d.pkg) ?? 0) * d.seats;
    const [customer] = await run<{ id: string }>(sql`select * from upsert_customer(${d.name}, ${whatsapp}, ${d.email + DEMO_EMAIL_SUFFIX})`);
    const [booking] = await run<{ id: string; access_token: string }>(
      sql`select * from create_booking(${customer.id}::uuid, ${slots[i % slots.length].id}::uuid, ${d.pkg}, ${d.seats}::int, ${amount}::numeric)`,
    );
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await run(sql`select * from create_payment(${booking.id}::uuid, ${amount}::numeric, ${expires}::timestamptz)`);

    if (d.outcome === "SUBMITTED" || d.outcome === "PAID" || d.outcome === "CHECKED_IN") {
      await run(sql`select submit_payment_proof(${booking.access_token}::uuid, ${null}::text)`);
    }
    if (d.outcome === "PAID" || d.outcome === "CHECKED_IN") await run(sql`select admin_mark_paid(${booking.id}::uuid)`);
    if (d.outcome === "CHECKED_IN") await run(sql`select admin_check_in(${booking.id}::uuid)`);
    if (d.outcome === "CANCELLED") await run(sql`select admin_cancel_booking(${booking.id}::uuid)`);
  }
  console.log(`Demo: ${DEMO.length} pemesan dan booking dibuat (pending, menunggu konfirmasi, lunas, check-in, batal).`);
}

async function cleanDemo() {
  const demo = await db.select({ id: customers.id }).from(customers).where(like(customers.email, `%${DEMO_EMAIL_SUFFIX}`));
  if (demo.length === 0) {
    console.log("Tidak ada data demo.");
    return;
  }
  const ids = demo.map((c) => c.id);
  const list = await db.select({ id: bookings.id, status: bookings.status }).from(bookings).where(sql`${bookings.customerId} in ${ids}`);
  // Cancel first so the seats go back to their sessions, then remove the rows.
  for (const b of list) if (b.status !== "CANCELLED") await run(sql`select admin_cancel_booking(${b.id}::uuid)`);
  if (list.length > 0) {
    await db.delete(payments).where(sql`${payments.bookingId} in ${list.map((b) => b.id)}`);
    await db.delete(bookings).where(sql`${bookings.customerId} in ${ids}`);
  }
  await db.delete(customers).where(and(like(customers.email, `%${DEMO_EMAIL_SUFFIX}`)));
  // Give back the booking/payment numbers the demo data used up.
  await run(sql`
    update number_counters c set value = coalesce(
      (select max(substring(booking_number from '[0-9]+$')::int) from bookings where booking_number like 'HLM-BOOK-' || c.year || '-%'), 0)
    where c.scope = 'booking'`);
  await run(sql`
    update number_counters c set value = coalesce(
      (select max(substring(payment_number from '[0-9]+$')::int) from payments where payment_number like 'HLM-PAY-' || c.year || '-%'), 0)
    where c.scope = 'payment'`);
  console.log(`Demo: ${demo.length} pemesan dan ${list.length} booking dihapus.`);
}

async function main() {
  if (flag("clean-demo")) {
    await cleanDemo();
    return;
  }
  await seedPackages();
  await seedSessions();
  if (flag("demo")) await seedDemo();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
