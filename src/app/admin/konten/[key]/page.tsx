import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ContentEditor } from "@/components/admin/content-editor";
import { getSiteContent, listEditedSections } from "@/lib/cms";
import { defaults, sectionDef, sections, type SectionDef, type SiteContent } from "@/lib/cms/schema";
import { resetContent } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditKontenPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { key } = await params;
  const { r } = await searchParams;
  const section = sectionDef(key);
  if (!section) notFound();

  // position among the sections of the same page, top to bottom
  const siblings = (sections as readonly SectionDef[]).filter((s) => s.page === section.page);
  const position = siblings.findIndex((s) => s.key === section.key);
  const prev = siblings[position - 1];
  const next = siblings[position + 1];

  const [content, edited] = await Promise.all([getSiteContent(), listEditedSections()]);
  const values = content[key as keyof SiteContent] as unknown as React.ComponentProps<typeof ContentEditor>["initialValues"];

  return (
    <>
      <Link href="/admin/konten" className="text-sm font-semibold text-muted hover:text-ink">
        ← Semua konten
      </Link>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-accent">
        {section.page === "home" ? "Halaman utama" : "Halaman & email lainnya"} · bagian {position + 1} dari {siblings.length}
      </p>
      <div className="mt-1">
        <AdminHeader
          title={section.label}
          description={section.description}
          action={
            edited.has(key) ? (
              <form action={resetContent}>
                <input type="hidden" name="key" value={key} />
                <ConfirmButton tone="danger" message="Kembalikan bagian ini ke teks bawaan? Editan akan hilang.">
                  Kembalikan ke bawaan
                </ConfirmButton>
              </form>
            ) : null
          }
        />
      </div>
      <div className="max-w-3xl">
        {/* key hanya berubah saat "Kembalikan ke bawaan" (?r=...), supaya form dibuat
            ulang dengan teks bawaan. Menyimpan TIDAK boleh membuat ulang form, kalau
            tidak pop up dan notifikasi "sudah tayang" ikut hilang. */}
        <ContentEditor
          key={r ?? "editor"}
          section={section}
          initialValues={values}
          defaultValues={defaults[key as keyof SiteContent] as unknown as typeof values}
        />
        <nav aria-label="Bagian lain" className="mt-8 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/admin/konten/${prev.key}`} className="rounded-card border border-line bg-surface p-4 transition-colors hover:border-accent/40">
              <span className="block text-xs text-muted">← Bagian di atasnya</span>
              <span className="mt-1 block font-bold text-ink">{prev.label}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next ? (
            <Link href={`/admin/konten/${next.key}`} className="rounded-card border border-line bg-surface p-4 text-right transition-colors hover:border-accent/40">
              <span className="block text-xs text-muted">Bagian di bawahnya →</span>
              <span className="mt-1 block font-bold text-ink">{next.label}</span>
            </Link>
          ) : null}
        </nav>
      </div>
    </>
  );
}
