import "server-only";

import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

/**
 * Koneksi basis data, boleh tidak ada.
 *
 * Website publik harus tetap tayang sebelum database dipasang: isinya jatuh
 * ke `src/content/site.ts`. Karena itu modul ini mengembalikan null, bukan
 * melempar galat, ketika DATABASE_URL belum diisi — dan setiap pemanggil
 * wajib menangani kemungkinan itu.
 *
 * Production memakai driver HTTP Neon. Driver itu tidak bisa bicara ke
 * Postgres biasa, jadi DATABASE_URL yang menunjuk ke localhost/127.0.0.1
 * (Postgres.app untuk pengembangan) memakai `pg` dengan antarmuka yang sama:
 * tagged template dan `sql.query(text, params)`, keduanya mengembalikan baris.
 */
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Sql {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
  query(text: string, params?: unknown[]): Promise<Row[]>;
}

let cached: Sql | null | undefined;

function isLocal(url: string): boolean {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

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

export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) cached = null;
  else cached = isLocal(url) ? localSql(url) : (neon(url) as unknown as Sql);
  return cached;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Dipakai jalur admin, yang memang tidak bisa berjalan tanpa basis data. */
export function requireSql(): Sql {
  const sql = getSql();
  if (!sql) {
    throw new Error(
      "DATABASE_URL belum diatur. Dashboard admin memerlukan basis data; website publik tetap jalan tanpanya.",
    );
  }
  return sql;
}
