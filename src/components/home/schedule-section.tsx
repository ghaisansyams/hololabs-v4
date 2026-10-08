import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { dailySlots, exhibitionDates } from "@/data/schedule";
import { formatDate, formatWeekday } from "@/lib/utils/date";

export function ScheduleSection() {
  return (
    <section id="jadwal" className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Jadwal"
          title="Lima hari, dua show per hari"
          description="Satu show berdurasi 1,5 jam. Sisa kursi tiap show dihitung langsung dari sistem saat kamu membuka halaman pemesanan."
          action={
            <Link href="/pesan" className={buttonStyles({ size: "sm" })}>
              Cek kursi & pesan
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {exhibitionDates.map((date, index) => (
            <Reveal key={date} delay={index * 60}>
              <div className="h-full rounded-card border border-line bg-surface p-5">
                <div className="flex items-center gap-2 text-accent">
                  <CalendarDays className="size-4" aria-hidden />
                  <span className="text-xs font-bold uppercase tracking-wide">{formatWeekday(date)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{formatDate(date)}</p>
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {dailySlots.map((slot) => (
                    <li key={slot.label} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Clock3 className="size-3.5 shrink-0 text-muted" aria-hidden />
                      {slot.time}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
