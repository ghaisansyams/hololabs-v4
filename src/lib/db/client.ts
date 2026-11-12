import { drizzle } from "drizzle-orm/node-postgres";
import type { SQL } from "drizzle-orm";
import { Pool, types } from "pg";
import * as schema from "./schema";

/**
 * The one database handle for the app: Drizzle ORM over node-postgres,
 * against plain Postgres (`DATABASE_URL`). Simple reads/writes use the typed
 * query builder; the atomic operations that live in SQL functions
 * (create_booking and friends, see db/schema.sql) are called with
 * `db.execute(sql\`select ...\`)`, since they rely on row locking an ORM
 * call can't express.
 *
 * Every call site is server-only, so `DATABASE_URL` never reaches the
 * browser. Created lazily so the site still renders without a database.
 */
import "server-only";

export { schema };

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// date/time/timestamp columns come back as plain strings ("2026-11-12",
// "18:00:00"), never JS Dates — that's what the UI and the SQL functions use.
for (const oid of [1082, 1083, 1114, 1184]) types.setTypeParser(oid, (value) => value);

const isLocalHost = (h: string) => h === "localhost" || h === "127.0.0.1" || h === "::1";

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database belum dikonfigurasi. Isi DATABASE_URL di .env.local (lihat .env.example).");
  // Remote Postgres usually requires TLS, often with a CA Node doesn't trust;
  // `rejectUnauthorized: false` keeps it encrypted without bundling that CA.
  const ssl = isLocalHost(new URL(url).hostname) ? undefined : { rejectUnauthorized: false };
  return drizzle(new Pool({ connectionString: url, max: 5, ssl }), { schema });
}

type Db = ReturnType<typeof create>;
const globalForDb = globalThis as unknown as { __db?: Db };

export function getDb(): Db {
  return (globalForDb.__db ??= create());
}

/** Runs a raw `sql\`...\`` statement (SQL function calls, joins/aggregates) and returns its rows. */
export async function rows<T = Record<string, unknown>>(query: SQL): Promise<T[]> {
  return (await getDb().execute(query)).rows as T[];
}
