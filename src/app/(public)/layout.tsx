import { SiteFooter } from "@/components/layout/site-footer";

// The footer reads contact info from the CMS on every public page.
export const dynamic = "force-dynamic";
import { SiteHeader } from "@/components/layout/site-header";
import { ScrollProgress } from "@/components/layout/scroll-progress";

/** Chrome for the customer-facing site. The ERP has its own shell. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <SiteHeader />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
