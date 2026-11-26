import type { Metadata } from "next";
import { HololabsBooking } from "@/components/booking/hololabs-booking";
import { getSiteContent } from "@/lib/cms";
import { getBookingDays, MAX_GUESTS, PAYMENT_MINUTES } from "@/lib/services/seat-booking";
import { toWhatsappE164 } from "@/lib/utils/phone";

export const metadata: Metadata = {
  title: "Pemesanan",
  description: "Pilih jadwal pertunjukan Perjalanan HOLOLABS, pilih kursi, dan bayar lewat transfer bank.",
  alternates: { canonical: "/booking" },
};

/** Same flow and look as hololabs.id/booking; data from this site's own database. */
export default async function BookingPage() {
  const [days, { booking, contact }] = await Promise.all([getBookingDays(), getSiteContent()]);
  const terms = booking.terms.map((t) => t.text.trim()).filter(Boolean);

  return (
    <>
      <div>
        <p className="hl-eyebrow">{booking.pageEyebrow}</p>
        <h1 className="hl-display mt-3 text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.05]">
          {booking.pageTitle} <span className="hl-text-grad">{booking.pageTitleAccent}</span>
        </h1>
      </div>
      <HololabsBooking
        initialDays={days}
        maxGuests={MAX_GUESTS}
        terms={terms}
        paymentMinutes={PAYMENT_MINUTES}
        bank={{ bank: booking.bank, holder: booking.holder }}
        whatsapp={toWhatsappE164(contact.whatsapp)}
        copy={{
          // Five steps drive the progress bar; an incomplete edit falls back to the built-in names.
          stepLabels: booking.stepLabels.length === 5 ? booking.stepLabels : ["Jadwal", "Pilih kursi", "Data diri", "Ketentuan", "Pembayaran"],
          dateTitle: booking.dateTitle,
          timeTitle: booking.timeTitle,
          seatTitle: booking.seatTitle,
          dataTitle: booking.dataTitle,
          dataNote: booking.dataNote,
          emailHint: booking.emailHint,
          termsTitle: booking.termsTitle,
          paymentTitle: booking.paymentTitle,
        }}
      />
    </>
  );
}
