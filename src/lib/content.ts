import "server-only";

import { getSql } from "./db";
import * as defaults from "@/content/site";

/**
 * Isi website: bawaan dari kode, ditimpa apa yang sudah diterbitkan admin.
 *
 * Basis data hanya menyimpan yang diubah, bukan salinan utuh. Akibatnya tiga
 * hal yang penting: website tetap tayang sebelum database ada, menambah field
 * baru di kode tidak perlu migrasi, dan mengosongkan satu override
 * mengembalikan teks aslinya.
 */

export type Overrides = Record<string, Record<string, string>>;

/** Field yang boleh disunting admin, per section. Di luar ini milik developer. */
export const EDITABLE: Record<string, { key: string; label: string; multiline?: boolean }[]> = {
  identity: [
    { key: "tagline", label: "Tagline" },
    { key: "description", label: "Deskripsi (dipakai SEO)", multiline: true },
    { key: "email", label: "Email" },
    { key: "whatsapp", label: "Nomor WhatsApp" },
    { key: "address", label: "Alamat lab", multiline: true },
    { key: "copyright", label: "Teks copyright footer" },
  ],
  hero: [
    { key: "eyebrow", label: "Label kecil di atas judul" },
    { key: "title", label: "Judul baris pertama" },
    { key: "titleAccent", label: "Judul baris kedua (bergradien)" },
    { key: "lead", label: "Paragraf pembuka", multiline: true },
  ],
  essence: [
    { key: "eyebrow", label: "Label kecil" },
    { key: "title", label: "Judul" },
    { key: "titleAccent", label: "Judul bergradien" },
  ],
  integration: [
    { key: "eyebrow", label: "Label kecil" },
    { key: "title", label: "Judul" },
    { key: "titleAccent", label: "Judul bergradien" },
  ],
  colorJourney: [
    { key: "eyebrow", label: "Label kecil" },
    { key: "title", label: "Judul" },
    { key: "titleAccent", label: "Judul bergradien" },
    { key: "lead", label: "Paragraf", multiline: true },
  ],
  ecosystem: [
    { key: "eyebrow", label: "Label kecil" },
    { key: "title", label: "Judul" },
    { key: "titleAccent", label: "Judul bergradien" },
    { key: "lead", label: "Paragraf", multiline: true },
    { key: "closing", label: "Kalimat penutup" },
  ],
  journey: [
    { key: "eyebrow", label: "Label kecil" },
    { key: "title", label: "Judul" },
    { key: "titleAccent", label: "Judul bergradien" },
    { key: "lead", label: "Paragraf", multiline: true },
  ],
  process: [
    { key: "eyebrow", label: "Label kecil" },
    { key: "title", label: "Judul" },
    { key: "titleAccent", label: "Judul bergradien" },
  ],
};

/** Nilai bawaan satu section, dibaca dari modul konten. */
function baseOf(key: string): Record<string, unknown> {
  const source = defaults as unknown as Record<string, unknown>;
  return (source[key] ?? {}) as Record<string, unknown>;
}

export function defaultsFor(sectionKey: string): Record<string, string> {
  const base = baseOf(sectionKey);
  const out: Record<string, string> = {};
  for (const field of EDITABLE[sectionKey] ?? []) {
    const value = base[field.key];
    out[field.key] = typeof value === "string" ? value : "";
  }
  return out;
}

/**
 * Ambil override.
 *
 * `draft: true` hanya dipanggil dari jalur pratinjau yang sudah memastikan
 * sesi admin; kolom draft tidak pernah sampai ke pengunjung biasa.
 */
export async function getOverrides(draft = false): Promise<Overrides> {
  const sql = getSql();
  if (!sql) return {};

  try {
    const rows = (await sql`
      select section_key, draft, published, is_visible, archived
      from cms_sections where page_key = 'home'
    `) as Record<string, unknown>[];

    const result: Overrides = {};
    for (const row of rows) {
      if (row.archived) continue;
      if (!draft && !row.is_visible) continue;
      const payload = (draft ? row.draft : row.published) as Record<string, string> | null;
      if (!payload) continue;
      // Nilai kosong berarti "pakai bawaan", bukan "kosongkan teksnya".
      const cleaned: Record<string, string> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (typeof value === "string" && value.trim() !== "") cleaned[key] = value;
      }
      if (Object.keys(cleaned).length > 0) result[String(row.section_key)] = cleaned;
    }
    return result;
  } catch (error) {
    // Database tidak terjangkau: website publik tetap harus tayang dengan
    // teks bawaan, bukan menampilkan halaman galat.
    console.error("[content] gagal membaca cms_sections", error);
    return {};
  }
}

/** Section yang disembunyikan admin. */
export async function getHiddenSections(): Promise<Set<string>> {
  const sql = getSql();
  if (!sql) return new Set();
  try {
    const rows = (await sql`
      select section_key from cms_sections
      where page_key = 'home' and (not is_visible or archived)
    `) as { section_key: string }[];
    return new Set(rows.map((r) => r.section_key));
  } catch {
    return new Set();
  }
}

/** Menggabungkan bawaan dengan override untuk satu section. */
export function merge<T extends object>(sectionKey: string, overrides: Overrides): T {
  return { ...(baseOf(sectionKey) as T), ...(overrides[sectionKey] ?? {}) } as T;
}
