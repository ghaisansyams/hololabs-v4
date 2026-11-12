"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { sanitizeSection } from "@/lib/cms";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

export interface ContentFormState {
  ok?: boolean;
  error?: string;
  savedAt?: string;
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

  await getDb()
    .insert(schema.cmsContent)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.cmsContent.key, set: { value, updatedAt: sql`now()` } });
  refreshSite();
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function resetContent(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  await getDb().delete(schema.cmsContent).where(eq(schema.cmsContent.key, key));
  refreshSite();
  revalidatePath(`/admin/konten/${key}`);
}
