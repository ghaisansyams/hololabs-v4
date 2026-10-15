"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { sanitizeSection } from "@/lib/cms";
import { getSql } from "@/lib/db/client";

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

  await getSql()`
    insert into cms_content (key, value, updated_at)
    values (${key}, ${JSON.stringify(value)}::jsonb, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
  refreshSite();
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function resetContent(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  await getSql()`delete from cms_content where key = ${key}`;
  refreshSite();
  revalidatePath(`/admin/konten/${key}`);
}
