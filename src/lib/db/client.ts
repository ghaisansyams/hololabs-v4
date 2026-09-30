import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Single Postgres connection for the booking engine, backed by Neon's HTTP
 * driver (works over fetch, so it's fine in Vercel's serverless functions).
 *
 * Every call site is server-only — a Server Component or a Server Action —
 * so `DATABASE_URL` never reaches the browser. Unlike the Supabase-backed
 * sibling project (Kelas Bermain), there is no separate anon/public key and
 * no Row Level Security: this connection string is the only secret, and it
 * stays on the server by construction (Next.js refuses to bundle a
 * server-only module — see `server-only` below — into client code).
 */
import "server-only";

const connectionString = process.env.DATABASE_URL;

type Sql = NeonQueryFunction<false, false>;

let sqlClient: Sql | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(connectionString);
}

/** Tagged-template query function: `sql\`select * from x where id = ${id}\``. */
export function getSql(): Sql {
  if (sqlClient) return sqlClient;
  if (!connectionString) {
    throw new Error(
      "Database belum dikonfigurasi. Isi DATABASE_URL di .env.local (lihat .env.example) " +
        "dengan connection string dari Neon.",
    );
  }
  sqlClient = neon(connectionString);
  return sqlClient;
}
