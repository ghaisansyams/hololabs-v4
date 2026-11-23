import type { Metadata } from "next";
import { CheckInForm } from "@/components/booking/checkin-form";
import { Container } from "@/components/ui/container";
import { getSiteContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Cek & Check-in Tiket",
  description: "Verifikasi nomor booking untuk check-in di lokasi exhibition Hololabs.",
};

export default async function CekTiketPage() {
  const { pages } = await getSiteContent();
  return (
    <Container as="section" className="max-w-lg py-12 sm:py-16">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{pages.cekTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
        {pages.cekBody}
      </p>
      <div className="mt-8">
        <CheckInForm />
      </div>
    </Container>
  );
}
