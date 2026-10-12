import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminHeader } from "@/components/admin/page-header";
import { listEditedSections } from "@/lib/cms";
import { sections } from "@/lib/cms/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Konten Website" };

export default async function KontenPage() {
  const edited = await listEditedSections();
  return (
    <>
      <AdminHeader
        title="Konten Website"
        description="Edit teks setiap bagian halaman depan. Perubahan langsung tampil di website setelah disimpan."
        action={
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink"
          >
            Lihat website ↗
          </a>
        }
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => {
          const updatedAt = edited.get(section.key);
          return (
            <li key={section.key}>
              <Link
                href={`/admin/konten/${section.key}`}
                className="flex h-full items-center justify-between gap-4 rounded-card border border-line bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <div>
                  <p className="font-bold text-ink">{section.label}</p>
                  <p className="mt-1 text-sm text-muted">{section.description}</p>
                  <p className="mt-2 text-xs text-muted">
                    {updatedAt
                      ? `Diedit ${new Date(updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`
                      : "Memakai teks bawaan"}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
