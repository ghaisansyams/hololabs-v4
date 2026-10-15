import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { siteConfig } from "@/data/site";
import { groupByDay, listAvailability, listPackages } from "@/lib/services/availability";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Reservasi",
  description: `Reservasi kursi untuk ${siteConfig.name}.`,
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

  return <BookingWizard schedule={schedule} packages={packages} initialPackageId={initialPackageId} />;
}
