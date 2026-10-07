import "server-only";

import type { Sql } from "./db";

/**
 * Pembatasan laju dihitung dari baris yang sudah tersimpan, bukan penghitung
 * di memori.
 *
 * Fungsi serverless hidup di banyak instance dan mati sewaktu-waktu, jadi
 * penghitung di memori akan bocor: lima instance berarti lima kali jatah.
 * Menghitung baris memang satu query tambahan, tetapi angkanya benar.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

interface Rule {
  table: "leads" | "bookings";
  column: "source_ip" | "email" | "whatsapp";
  value: string;
  minutes: number;
  limit: number;
}

export async function tooMany(sql: Sql, rules: Rule[]): Promise<boolean> {
  for (const rule of rules) {
    if (!rule.value || rule.value === "unknown") continue;

    // Nama tabel dan kolom berasal dari serikat tertutup di atas, tidak
    // pernah dari masukan pengguna; hanya nilainya yang diparameterkan.
    const rows = (await sql.query(
      `select count(*)::int as count from ${rule.table}
       where ${rule.column} = $1 and created_at > now() - ($2 || ' minutes')::interval`,
      [rule.value, String(rule.minutes)],
    )) as { count: number }[];

    if ((rows[0]?.count ?? 0) >= rule.limit) return true;
  }
  return false;
}
