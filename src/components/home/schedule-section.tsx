import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TiltCard } from "@/components/ui/tilt-card";
import { dailySlots, exhibitionDates } from "@/data/schedule";
import { getSiteContent } from "@/lib/cms";
import { groupByDay, listAvailability } from "@/lib/services/availability";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatTimeRange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface DayView {
  date: string;
  slots: { key: string; time: string; seatsLeft: number | null }[];
}

/**
 * Days and show times come from the `sessions` table, which the admin
 * manages under Sesi — so adding or moving a show there updates this
 * section and the booking page together. Falls back to the original
 * static schedule only if the database can't be reached.
 */
export async function ScheduleSection() {
  const [{ schedule }, sessions] = await Promise.all([getSiteContent(), listAvailability()]);

  const days: DayView[] =
    sessions.length > 0
      ? groupByDay(sessions).map((day) => ({
          date: day.date,
          slots: day.sessions.map((s) => ({
            key: s.id,
            time: formatTimeRange(s.startTime, s.endTime).replace(" WIB", ""),
            seatsLeft: s.seatsLeft,
          })),
        }))
      : exhibitionDates.map((date) => ({
          date,
          slots: dailySlots.map((slot) => ({ key: slot.label, time: slot.time, seatsLeft: null })),
        }));

  return (
    <section id="jadwal" className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow={schedule.eyebrow}
          title={schedule.title}
          description={schedule.description}
          action={
            <Link href="/pesan" className={buttonStyles({ size: "sm" })}>
              {schedule.cta}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />

        {days.length === 0 ? (
          <p className="mt-10 text-sm text-muted">Belum ada jadwal show yang dibuka.</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {days.map((day, index) => (
              <Reveal key={day.date} delay={index * 60}>
                <TiltCard className="h-full" max={6}>
                  <div className="h-full rounded-card border border-line bg-surface p-5">
                    <div className="flex items-center gap-2 text-accent">
                      <CalendarDays className="size-4" aria-hidden />
                      <span className="text-xs font-bold uppercase tracking-wide">{formatWeekday(day.date)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">{formatDate(day.date)}</p>
                    <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
                      {day.slots.map((slot) => (
                        <li key={slot.key} className="text-sm text-ink-soft">
                          <span className="flex items-center gap-2">
                            <Clock3 className="size-3.5 shrink-0 text-muted" aria-hidden />
                            {slot.time}
                          </span>
                          {slot.seatsLeft !== null ? (
                            <span
                              className={cn(
                                "ml-5.5 block text-xs font-semibold",
                                slot.seatsLeft > 0 ? "text-success" : "text-danger",
                              )}
                            >
                              {slot.seatsLeft > 0 ? `${slot.seatsLeft} kursi tersisa` : "Penuh"}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
