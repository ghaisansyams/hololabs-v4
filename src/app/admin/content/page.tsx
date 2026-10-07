import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getSql, hasDatabase } from "@/lib/db";
import { EDITABLE, defaultsFor } from "@/lib/content";
import { sceneNav } from "@/content/site";
import { SectionEditor } from "./section-editor";
import { PublishPanel, VisibilityToggle } from "./controls";

export const metadata = { title: "Website Builder", robots: { index: false, follow: false } };

interface Row {
  section_key: string;
  draft: Record<string, string> | null;
  published: Record<string, string> | null;
  is_visible: boolean;
  updated_at: string;
}

export default async function ContentPage() {
  if (!hasDatabase()) redirect("/admin/login");
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const sql = getSql()!;
  // Hasil driver Neon diketik longgar, jadi pengetikan dilakukan setelah
  // await, bukan dengan menandai promise-nya.
  const [sectionRows, versionRows] = await Promise.all([
    sql`select section_key, draft, published, is_visible, updated_at
        from cms_sections where page_key = 'home'`,
    sql`select v.id, v.note, v.created_at, u.name, u.email
        from cms_versions v left join users u on u.id = v.created_by
        where v.scope = 'page' and v.scope_key = 'home'
        order by v.created_at desc limit 10`,
  ]);

  const sections = sectionRows as unknown as Row[];
  const versions = versionRows as unknown as Record<string, string>[];

  const byKey = new Map(sections.map((row) => [row.section_key, row]));
  const pendingCount = sections.filter(
    (row) => JSON.stringify(row.draft ?? {}) !== JSON.stringify(row.published ?? {}),
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="holo-display text-2xl text-white">Website Builder</h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/45">
            Mengubah isi di sini menyimpan ke draft. Website publik baru berubah setelah
            diterbitkan. Mengosongkan satu kolom mengembalikan teks bawaannya.
          </p>
        </div>
        <a
          href="/api/preview"
          className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/75 transition hover:border-white/50 hover:text-white"
        >
          Lihat pratinjau draft →
        </a>
      </div>

      <PublishPanel
        pending={pendingCount}
        canPublish={session.role === "SUPER_ADMIN"}
        versions={versions.map((v) => ({
          id: String(v.id),
          note: String(v.note ?? ""),
          by: String(v.name || v.email || "—"),
          at: new Date(String(v.created_at)).toLocaleString("id-ID"),
        }))}
      />

      <section className="mt-10">
        <h2 className="holo-display text-lg text-white">Tampilkan atau sembunyikan scene</h2>
        <p className="mt-1.5 text-sm text-white/45">
          Berlaku langsung di website. Isinya tidak dihapus, hanya tidak ditampilkan.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {sceneNav.map((scene) => (
            <li key={scene.key}>
              <VisibilityToggle
                sectionKey={scene.key}
                label={scene.label}
                visible={byKey.get(scene.key)?.is_visible ?? true}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="holo-display text-lg text-white">Teks per bagian</h2>
        {Object.keys(EDITABLE).map((key) => (
          <SectionEditor
            key={key}
            sectionKey={key}
            fields={EDITABLE[key]}
            fallback={defaultsFor(key)}
            draft={byKey.get(key)?.draft ?? {}}
            dirty={
              JSON.stringify(byKey.get(key)?.draft ?? {}) !==
              JSON.stringify(byKey.get(key)?.published ?? {})
            }
          />
        ))}
      </section>
    </div>
  );
}
