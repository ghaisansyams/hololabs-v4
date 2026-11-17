import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ContentEditor } from "@/components/admin/content-editor";
import { getSiteContent, listEditedSections } from "@/lib/cms";
import { defaults, sectionDef, type SiteContent } from "@/lib/cms/schema";
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

  const [content, edited] = await Promise.all([getSiteContent(), listEditedSections()]);
  const values = content[key as keyof SiteContent] as unknown as React.ComponentProps<typeof ContentEditor>["initialValues"];

  return (
    <>
      <Link href="/admin/konten" className="text-sm font-semibold text-muted hover:text-ink">
        ← Semua konten
      </Link>
      <div className="mt-3">
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
      </div>
    </>
  );
}
