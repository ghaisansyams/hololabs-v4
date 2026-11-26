import "server-only";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db/client";

/**
 * Activity log: one row for every change made on the website (admin edits,
 * logins, guest orders). It is append-only on purpose: nothing in the app
 * edits or deletes a row, so the list in /admin/log can be trusted as a record
 * of who did what, when, and from which address.
 *
 * The table is created on first use, so a database that has not run
 * db/schema.sql keeps working. Logging never throws: a failed write must not
 * break the action it describes.
 */

export const ACTIVITY_CATEGORIES = ["Login", "Booking", "Pembayaran", "Email", "Sesi", "Konten", "Pelanggan", "Ekspor"] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface ActivityEntry {
  category: ActivityCategory;
  action: string;
  /** What was changed: a booking number, a date, a content section. */
  target?: string;
  /** Plain-language details such as "Jadwal: A → B". Never put passwords or tokens here. */
  detail?: string;
  /** Who did it. Defaults to the admin account. */
  actor?: string;
}

export interface ActivityRow {
  id: number;
  wib: string;
  actor: string;
  category: string;
  action: string;
  target: string;
  detail: string;
  ip: string;
  device: string;
}

let ready: Promise<void> | null = null;

export function ensureActivityLog(): Promise<void> {
  ready ??= (async () => {
    await rows(sql`
      create table if not exists activity_log (
        id bigserial primary key,
        created_at timestamptz not null default now(),
        actor text not null default 'admin',
        category text not null,
        action text not null,
        target text not null default '',
        detail text not null default '',
        ip text not null default '',
        user_agent text not null default ''
      )`);
    await rows(sql`create index if not exists activity_log_created_idx on activity_log (created_at desc)`);
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

const clip = (value: string | undefined, max: number) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * The visitor's address as the reverse proxy reports it. X-Real-IP is set by
 * the proxy itself; in X-Forwarded-For the last entry is the one the proxy
 * appended, while earlier entries can be written by the visitor.
 */
async function requestOrigin(): Promise<{ ip: string; userAgent: string }> {
  try {
    const h = await headers();
    const real = h.get("x-real-ip")?.trim();
    const forwarded = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return { ip: clip(real || forwarded[forwarded.length - 1] || "", 64), userAgent: clip(h.get("user-agent") ?? "", 240) };
  } catch {
    return { ip: "", userAgent: "" };
  }
}

export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    await ensureActivityLog();
    const { ip, userAgent } = await requestOrigin();
    await rows(sql`
      insert into activity_log (actor, category, action, target, detail, ip, user_agent)
      values (${clip(entry.actor ?? "admin", 60)}, ${entry.category}, ${clip(entry.action, 120)}, ${clip(entry.target, 160)}, ${clip(entry.detail, 1500)}, ${ip}, ${userAgent})`);
  } catch (cause) {
    console.error("[log] gagal mencatat aktivitas", cause);
  }
}

/** "Chrome · macOS" from a user-agent string; good enough to tell devices apart. */
export function deviceName(userAgent: string): string {
  if (!userAgent) return "";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Browser";
  const os = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad|iPod/.test(userAgent)
      ? "iOS"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

export const ACTIVITY_PAGE_SIZE = 40;

export async function listActivity(opts: { category?: string; q?: string; page?: number }): Promise<{ items: ActivityRow[]; total: number; page: number; pages: number }> {
  await ensureActivityLog();
  const category = (ACTIVITY_CATEGORIES as readonly string[]).includes(opts.category ?? "") ? (opts.category as string) : "";
  const needle = `%${(opts.q ?? "").trim().replace(/[%_\\]/g, "\\$&")}%`;
  const hasNeedle = (opts.q ?? "").trim() !== "";
  const where = sql`
    (${category}::text = '' or category = ${category})
    and (${hasNeedle}::boolean = false or action ilike ${needle} or target ilike ${needle} or detail ilike ${needle} or actor ilike ${needle} or ip ilike ${needle})`;
  const [{ count }] = await rows<{ count: string }>(sql`select count(*)::text as count from activity_log where ${where}`);
  const total = Number(count);
  const pages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1) || 1), pages);
  const list = await rows<{ id: string; wib: string; actor: string; category: string; action: string; target: string; detail: string; ip: string; user_agent: string }>(sql`
    select id::text, to_char(created_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS') as wib,
           actor, category, action, target, detail, ip, user_agent
    from activity_log where ${where}
    order by created_at desc, id desc
    limit ${ACTIVITY_PAGE_SIZE} offset ${(page - 1) * ACTIVITY_PAGE_SIZE}`);
  return {
    items: list.map((r) => ({ id: Number(r.id), wib: r.wib, actor: r.actor, category: r.category, action: r.action, target: r.target, detail: r.detail, ip: r.ip, device: deviceName(r.user_agent) })),
    total,
    page,
    pages,
  };
}

/** Rupiah without importing the UI formatter into server code paths. */
export const rp = (n: number) => `Rp${Math.round(n).toLocaleString("id-ID")}`;
