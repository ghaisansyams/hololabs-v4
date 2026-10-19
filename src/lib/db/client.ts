import { Pool, types } from "pg";

/**
 * Single Postgres connection for the booking engine.
 *
 * Plain Postgres, over the standard wire protocol — no managed-provider
 * SDK, so this runs against anything that speaks Postgres: a VPS you
 * install it on yourself, a managed instance from your host, or any other
 * plain server.
 *
 * Every call site is server-only — a Server Component or a Server Action —
 * so `DATABASE_URL` never reaches the browser.
 */
import "server-only";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Sql {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
  query(text: string, params?: unknown[]): Promise<Row[]>;
}

const connectionString = process.env.DATABASE_URL;

let sqlClient: Sql | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(connectionString);
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

// Some date/time columns are also cast to text in the SQL itself (see
// db/schema.sql); this parser swap covers the rest, so every caller always
// gets plain strings back regardless of which column it reads.
for (const oid of [1082, 1083, 1114, 1184]) types.setTypeParser(oid, (value) => value);

function pgSql(url: string): Sql {
  const hostname = new URL(url).hostname;
  // Managed/remote Postgres almost always requires TLS, and frequently with
  // a certificate chain Node doesn't already trust (self-signed, or a
  // provider-specific CA) — `rejectUnauthorized: false` keeps the
  // connection encrypted without needing that CA bundle wired in here.
  // Localhost (for local dev) needs neither.
  const ssl = isLocalHost(hostname) ? undefined : { rejectUnauthorized: false };
  const pool = new Pool({ connectionString: url, max: 5, ssl });
  const run = async (text: string, params: unknown[] = []) => (await pool.query(text, params)).rows;
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0];
    values.forEach((_, i) => {
      text += `$${i + 1}${strings[i + 1]}`;
    });
    return run(text, values);
  }) as Sql;
  sql.query = run;
  return sql;
}

/** Tagged-template query function: `sql\`select * from x where id = ${id}\``. */
export function getSql(): Sql {
  if (sqlClient) return sqlClient;
  if (!connectionString) {
    throw new Error(
      "Database belum dikonfigurasi. Isi DATABASE_URL di .env.local (lihat .env.example).",
    );
  }
  sqlClient = pgSql(connectionString);
  return sqlClient;
}
