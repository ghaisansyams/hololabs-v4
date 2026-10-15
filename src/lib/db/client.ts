import { neon } from "@neondatabase/serverless";
import { Pool, types } from "pg";

/**
 * Single Postgres connection for the booking engine.
 *
 * Production uses Neon's HTTP driver (works over fetch, fine in Vercel's
 * serverless functions). That driver can't talk to a plain Postgres server,
 * so a DATABASE_URL pointing at localhost (Postgres.app, for local
 * development) goes through `pg` instead, behind the same interface:
 * a tagged template and `sql.query(text, params)`, both returning rows.
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

function isLocal(url: string): boolean {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

// Neon's HTTP driver hands dates and times back as strings; pg would parse
// them into Date objects. Keep pg identical so no caller can tell which
// driver served it.
for (const oid of [1082, 1083, 1114, 1184]) types.setTypeParser(oid, (value) => value);

function localSql(url: string): Sql {
  const pool = new Pool({ connectionString: url, max: 5 });
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
  sqlClient = isLocal(connectionString)
    ? localSql(connectionString)
    : (neon(connectionString) as unknown as Sql);
  return sqlClient;
}
