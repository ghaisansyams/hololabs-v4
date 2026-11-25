import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminHeader } from "@/components/admin/page-header";
import { listEditedSections } from "@/lib/cms";
import { sections, type SectionDef } from "@/lib/cms/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Konten Website" };

const GROUPS: { page: SectionDef["page"]; title: string; note: string }[] = [
  { page: "home", title: "Halaman utama", note: "Urut dari atas ke bawah, sama seperti saat website di-scroll." },
  { page: "other", title: "Halaman & email lainnya", note: "Alur pemesanan, email otomatis, dan halaman 404." },
];

export default async function KontenPage() {
  const edited = await listEditedSections();
  return (
    <>
      <AdminHeader
        title="Konten Website"
        description="Edit teks dan gambar setiap bagian website. Perubahan langsung tampil di website setelah disimpan."
        action={
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-accent/50 hover:text-ink sm:self-auto"
          >
            Lihat website ↗
          </a>
        }
      />
      <div className="max-w-3xl space-y-12">
        {GROUPS.map((group) => {
          const list = (sections as readonly SectionDef[]).filter((s) => s.page === group.page);
          return (
            <section key={group.page} aria-labelledby={`grup-${group.page}`}>
              <h2 id={`grup-${group.page}`} className="text-lg font-extrabold text-ink">
                {group.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{group.note}</p>
              <ol className="relative mt-5 space-y-3">
                {/* the line joining the numbers, like the page read from top to bottom */}
                <span aria-hidden className="absolute bottom-8 left-[1.1875rem] top-8 w-px bg-line" />
                {list.map((section, index) => {
                  const updatedAt = edited.get(section.key);
                  return (
                    <li key={section.key} className="relative flex items-stretch gap-4">
                      <span className="relative z-10 mt-5 flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-sm font-bold text-ink-soft">
                        {index + 1}
                      </span>
                      <Link
                        href={`/admin/konten/${section.key}`}
                        className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-card border border-line bg-surface p-5 transition-colors hover:border-accent/40"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-ink">{section.label}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{section.description}</p>
                          <p className={`mt-2 text-xs ${updatedAt ? "font-semibold text-accent" : "text-muted"}`}>
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
              </ol>
            </section>
          );
        })}
      </div>
    </>
  );
}
