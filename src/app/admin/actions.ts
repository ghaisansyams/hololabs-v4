"use server";

// updateTag, bukan revalidateTag: di Next 16 revalidateTag menjadwalkan
// kedaluwarsa, sedangkan publish harus langsung terlihat pengunjung
// berikutnya. updateTag memberi semantik baca-hasil-tulisan-sendiri.
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { requireSql } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { getSession, requireSession, requireSuperAdmin, signIn, signOut } from "@/lib/auth";
import { EDITABLE } from "@/lib/content";

type Result = { ok: boolean; message: string };

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function signInAction(_prev: Result | null, formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Email dan kata sandi wajib diisi." };

  try {
    const result = await signIn(email, password, await ip());
    if (!result.ok) return { ok: false, message: result.message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal masuk.",
    };
  }
  redirect("/admin");
}

export async function signOutAction() {
  const session = await getSession();
  if (session) {
    await recordAudit({
      userId: session.id,
      action: "LOGOUT",
      entity: "users",
      entityId: session.id,
      ip: await ip(),
    });
  }
  await signOut();
  redirect("/admin/login");
}

/**
 * Simpan sebagai draft.
 *
 * Tidak memanggil revalidateTag: yang berubah hanya kolom draft, dan website
 * publik membaca kolom published. Perubahan baru terlihat pengunjung setelah
 * Publish (PRD Lampiran B).
 */
export async function saveDraftAction(_prev: Result | null, formData: FormData): Promise<Result> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return { ok: false, message: "Sesi berakhir. Masuk lagi." };
  }

  const sectionKey = String(formData.get("sectionKey") ?? "");
  const fields = EDITABLE[sectionKey];
  if (!fields) return { ok: false, message: "Section tidak dikenal." };

  const draft: Record<string, string> = {};
  for (const field of fields) {
    const value = String(formData.get(field.key) ?? "").trim();
    if (value) draft[field.key] = value;
  }

  const sql = requireSql();
  await sql`
    insert into cms_sections (page_key, section_key, label, draft, updated_at, updated_by)
    values ('home', ${sectionKey}, ${sectionKey}, ${JSON.stringify(draft)}::jsonb, now(), ${session.id})
    on conflict (page_key, section_key) do update
      set draft = excluded.draft, updated_at = now(), updated_by = excluded.updated_by
  `;

  await recordAudit({
    userId: session.id,
    action: "CMS_DRAFT_SAVED",
    entity: "cms_sections",
    entityId: sectionKey,
    newValue: draft,
    ip: await ip(),
  });

  return { ok: true, message: "Draft tersimpan. Lihat pratinjau sebelum menerbitkan." };
}

/**
 * Terbitkan seluruh section halaman.
 *
 * Snapshot keadaan sekarang disimpan lebih dulu, lalu draft disalin ke
 * published. Keduanya dalam satu pernyataan supaya tidak pernah ada keadaan
 * setengah jadi yang dilihat pengunjung.
 */
export async function publishAction(_prev: Result | null, formData: FormData): Promise<Result> {
  let session;
  try {
    session = await requireSuperAdmin();
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error && error.message === "FORBIDDEN"
          ? "Hanya Super Admin yang bisa menerbitkan."
          : "Sesi berakhir. Masuk lagi.",
    };
  }

  const note = String(formData.get("note") ?? "").trim();
  const sql = requireSql();

  const snapshot = (await sql`
    select coalesce(jsonb_agg(jsonb_build_object(
      'sectionKey', section_key, 'published', published,
      'sortOrder', sort_order, 'isVisible', is_visible
    )), '[]'::jsonb) as snapshot
    from cms_sections where page_key = 'home'
  `) as { snapshot: unknown }[];

  await sql`
    insert into cms_versions (scope, scope_key, snapshot, note, created_by)
    values ('page', 'home', ${JSON.stringify(snapshot[0].snapshot)}::jsonb, ${note}, ${session.id})
  `;

  const updated = (await sql`
    update cms_sections
    set published = draft, published_at = now(), updated_by = ${session.id}
    where page_key = 'home' and draft is distinct from published
    returning section_key
  `) as { section_key: string }[];

  await recordAudit({
    userId: session.id,
    action: "CMS_PUBLISH",
    entity: "cms_sections",
    entityId: "home",
    newValue: { sections: updated.length, note },
    ip: await ip(),
  });

  updateTag("cms");
  return {
    ok: true,
    message:
      updated.length === 0
        ? "Tidak ada perubahan untuk diterbitkan."
        : `${updated.length} section terbit ke website.`,
  };
}

/** Memulihkan versi lama ke kolom draft, bukan langsung tayang. */
export async function restoreVersionAction(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  let session;
  try {
    session = await requireSuperAdmin();
  } catch {
    return { ok: false, message: "Hanya Super Admin yang bisa memulihkan versi." };
  }

  const versionId = String(formData.get("versionId") ?? "");
  const sql = requireSql();

  const rows = (await sql`
    select snapshot from cms_versions where id = ${versionId}
  `) as { snapshot: { sectionKey: string; published: Record<string, string> | null }[] }[];

  if (rows.length === 0) return { ok: false, message: "Versi tidak ditemukan." };

  for (const item of rows[0].snapshot) {
    if (!item.published) continue;
    await sql`
      update cms_sections set draft = ${JSON.stringify(item.published)}::jsonb, updated_at = now()
      where page_key = 'home' and section_key = ${item.sectionKey}
    `;
  }

  await recordAudit({
    userId: session.id,
    action: "CMS_RESTORE",
    entity: "cms_versions",
    entityId: versionId,
    ip: await ip(),
  });

  return {
    ok: true,
    message: "Versi dipulihkan ke draft. Periksa pratinjau, lalu terbitkan.",
  };
}

export async function toggleSectionAction(formData: FormData) {
  const session = await requireSession();
  const sectionKey = String(formData.get("sectionKey") ?? "");
  const visible = String(formData.get("visible") ?? "") === "1";

  const sql = requireSql();
  await sql`
    insert into cms_sections (page_key, section_key, label, is_visible)
    values ('home', ${sectionKey}, ${sectionKey}, ${visible})
    on conflict (page_key, section_key) do update set is_visible = ${visible}, updated_at = now()
  `;

  await recordAudit({
    userId: session.id,
    action: visible ? "SECTION_SHOWN" : "SECTION_HIDDEN",
    entity: "cms_sections",
    entityId: sectionKey,
    ip: await ip(),
  });

  updateTag("cms");
}

export async function updateLeadStatusAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];
  if (!allowed.includes(status)) return;

  const sql = requireSql();
  await sql`update leads set status = ${status}, updated_at = now() where id = ${id}`;
  await recordAudit({
    userId: session.id,
    action: "LEAD_STATUS",
    entity: "leads",
    entityId: id,
    newValue: { status },
    ip: await ip(),
  });
}

export async function updateBookingStatusAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["PENDING", "CONFIRMED", "ATTENDED", "NO_SHOW", "CANCELLED"];
  if (!allowed.includes(status)) return;

  const sql = requireSql();
  await sql`update bookings set status = ${status}, updated_at = now() where id = ${id}`;
  await recordAudit({
    userId: session.id,
    action: "BOOKING_STATUS",
    entity: "bookings",
    entityId: id,
    newValue: { status },
    ip: await ip(),
  });
}
