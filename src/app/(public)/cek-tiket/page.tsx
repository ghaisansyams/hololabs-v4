import type { Metadata } from "next";
import { CheckInForm } from "@/components/booking/checkin-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cek & Check-in Tiket",
  description: "Verifikasi nomor booking untuk check-in di lokasi Holomoc Exhibition.",
};

export default function CekTiketPage() {
  return (
    <Container as="section" className="max-w-lg py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Cek & Check-in Tiket</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
        Untuk petugas di lokasi: masukkan nomor booking dan nomor WhatsApp pemesan untuk memvalidasi
        dan mencatat kehadiran.
      </p>
      <div className="mt-8">
        <CheckInForm />
      </div>
    </Container>
  );
}
