import "server-only";

import { getSql } from "./db";

/**
 * Catatan audit bersifat hanya-tambah (PRD bagian 9).
 *
 * Kegagalan menulis audit tidak boleh menggagalkan aksi yang sedang berjalan
 * — reservasi yang sah lebih penting daripada barisan log — tetapi juga tidak
 * boleh hilang diam-diam, jadi tetap dicatat ke log server.
 */
export async function recordAudit(entry: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
}) {
  const sql = getSql();
  if (!sql) return;

  try {
    await sql`
      insert into audit_logs (user_id, action, entity, entity_id, old_value, new_value, ip)
      values (
        ${entry.userId ?? null},
        ${entry.action},
        ${entry.entity},
        ${entry.entityId ?? ""},
        ${entry.oldValue ? JSON.stringify(entry.oldValue) : null},
        ${entry.newValue ? JSON.stringify(entry.newValue) : null},
        ${entry.ip ?? null}
      )
    `;
  } catch (error) {
    console.error("[audit] gagal mencatat", entry.action, error);
  }
}
