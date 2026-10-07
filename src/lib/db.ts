import "server-only";

import { neon } from "@neondatabase/serverless";

/**
 * Koneksi basis data, boleh tidak ada.
 *
 * Website publik harus tetap tayang sebelum database dipasang: isinya jatuh
 * ke `src/content/site.ts`. Karena itu modul ini mengembalikan null, bukan
 * melempar galat, ketika DATABASE_URL belum diisi — dan setiap pemanggil
 * wajib menangani kemungkinan itu.
 */
export type Sql = ReturnType<typeof neon>;

let cached: Sql | null | undefined;

export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL;
  cached = url ? neon(url) : null;
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
