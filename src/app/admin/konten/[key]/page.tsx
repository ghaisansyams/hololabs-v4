import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ContentEditor } from "@/components/admin/content-editor";
import { getSiteContent, listEditedSections } from "@/lib/cms";
import { sectionDef, type SiteContent } from "@/lib/cms/schema";
import { resetContent } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditKontenPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
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
        {/* key on edited timestamp: after a reset the form remounts with defaults. */}
        <ContentEditor key={edited.get(key) ?? "default"} section={section} initialValues={values} />
      </div>
    </>
  );
}
