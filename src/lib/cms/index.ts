import "server-only";
import { cache } from "react";
import { getSql, isDatabaseConfigured } from "@/lib/db/client";
import { defaults, sectionDef, type FieldDef, type SiteContent } from "./schema";

/**
 * Website content: code defaults overlaid with whatever the admin saved in
 * `cms_content`. Cached per request, so every component on a page shares
 * one query. If the database is unreachable the site still renders with the
 * defaults rather than failing.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const content = structuredClone(defaults);
  if (!isDatabaseConfigured()) return content;
  try {
    const rows = await getSql()`select key, value from cms_content`;
    for (const row of rows) {
      const key = row.key as keyof SiteContent;
      if (key in content && row.value && typeof row.value === "object") {
        Object.assign(content[key], row.value);
      }
    }
  } catch (error) {
    console.error("[cms] gagal membaca konten, memakai default", error);
  }
  return content;
});

/** Admin-only: which sections have been edited, and when. */
export async function listEditedSections(): Promise<Map<string, string>> {
  const rows = await getSql()`select key, updated_at::text as updated_at from cms_content`;
  return new Map(rows.map((r) => [r.key as string, r.updated_at as string]));
}

type Value = string | string[] | Record<string, string | string[]>[];

function cleanText(value: unknown, max: number): string {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function cleanField(field: FieldDef, value: unknown): Value {
  if (field.type === "text" || field.type === "textarea") {
    return cleanText(value, field.max ?? (field.type === "text" ? 160 : 600));
  }
  if (field.type === "tags") {
    const list = Array.isArray(value) ? value : String(value ?? "").split("\n");
    return list.map((v) => cleanText(v, 120)).filter(Boolean).slice(0, 30);
  }
  if (field.type !== "list") return "";
  const items = Array.isArray(value) ? value : [];
  const max = field.max ?? 20;
  return items.slice(0, max).map((item) => {
    const out: Record<string, string | string[]> = {};
    for (const sub of field.fields) {
      out[sub.key] = cleanField(sub, (item as Record<string, unknown>)?.[sub.key]) as string | string[];
    }
    return out;
  });
}

/**
 * Keeps only known keys, coerces types, and trims lengths. The admin form
 * is trusted, but the server action behind it is still an HTTP endpoint.
 */
export function sanitizeSection(key: string, input: unknown): Record<string, Value> | string {
  const def = sectionDef(key);
  if (!def) return "Section tidak dikenal.";
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Record<string, Value> = {};
  for (const field of def.fields) {
    const value = cleanField(field, data[field.key]);
    if (field.type === "list" && Array.isArray(value) && value.length < (field.min ?? 0)) {
      return `${field.label} minimal ${field.min} item.`;
    }
    out[field.key] = value;
  }
  return out;
}
