"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { getSiteContent, sanitizeSection } from "@/lib/cms";
import { sectionDef } from "@/lib/cms/schema";
import { logActivity } from "@/lib/services/activity-log";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

export interface ContentFormState {
  ok?: boolean;
  error?: string;
  savedAt?: string;
}

const brief = (text: unknown, max = 40) => {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

/** Plain-language list of the fields that differ between what is live and what was just saved. */
function describeChanges(key: string, before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const field of sectionDef(key)?.fields ?? []) {
    if (field.type === "heading") continue;
    const was = before[field.key];
    const now = after[field.key];
    if (JSON.stringify(was ?? "") === JSON.stringify(now ?? "")) continue;
    if (field.type === "image") out.push(`${field.label}: gambar diganti`);
    else if (field.type === "video") out.push(`${field.label}: ${now ? "video diganti" : "video dihapus"}`);
    else if (field.type === "tags") out.push(`${field.label}: diubah`);
    else if (field.type === "list") out.push(`${field.label}: daftar diubah (${Array.isArray(now) ? now.length : 0} item)`);
    else out.push(`${field.label}: "${brief(was)}" → "${brief(now)}"`);
  }
  return out;
}

function refreshSite() {
  // Every public page shares the footer, so revalidate the whole layout.
  revalidatePath("/", "layout");
}

export async function saveContent(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("value") ?? "{}"));
  } catch {
    return { error: "Data form tidak terbaca. Muat ulang halaman lalu coba lagi." };
  }

  const value = sanitizeSection(key, parsed);
  if (typeof value === "string") return { error: value };

  const live = (await getSiteContent()) as unknown as Record<string, Record<string, unknown>>;
  const changes = describeChanges(key, live[key] ?? {}, value as Record<string, unknown>);

  await getDb()
    .insert(schema.cmsContent)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.cmsContent.key, set: { value, updatedAt: sql`now()` } });
  if (changes.length) {
    await logActivity({
      category: "Konten",
      action: "Ubah konten website",
      target: sectionDef(key)?.label ?? key,
      detail: changes.slice(0, 10).join(". ") + (changes.length > 10 ? `. +${changes.length - 10} perubahan lain` : ""),
    });
  }
  refreshSite();
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function resetContent(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  await getDb().delete(schema.cmsContent).where(eq(schema.cmsContent.key, key));
  await logActivity({ category: "Konten", action: "Kembalikan konten ke bawaan", target: sectionDef(key)?.label ?? key });
  refreshSite();
  revalidatePath(`/admin/konten/${key}`);
  // ?r=... membuat form di halaman editor dimuat ulang dengan teks bawaan.
  redirect(`/admin/konten/${encodeURIComponent(key)}?r=${Date.now()}`);
}
