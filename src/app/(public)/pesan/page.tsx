import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { MateriPreview } from "@/components/booking/materi-preview";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/data/site";
import { groupByDay, listAvailability, listPackages } from "@/lib/services/availability";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pesan Tiket",
  description: `Pilih sesi dan paket F&B untuk ${siteConfig.name}.`,
};

export default async function PesanPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const [{ package: initialPackageId }, sessions, packages] = await Promise.all([
    searchParams,
    listAvailability(),
    listPackages(),
  ]);
  const schedule = groupByDay(sessions);

  return (
    <Container as="section" className="py-10 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Pesan Tiket {siteConfig.shortName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
          Pilih tanggal, sesi, dan paket F&amp;B. Sisa kursi di bawah ini diambil langsung dari sistem.
        </p>
      </div>
      <MateriPreview />
      <BookingWizard schedule={schedule} packages={packages} initialPackageId={initialPackageId} />
    </Container>
  );
}
