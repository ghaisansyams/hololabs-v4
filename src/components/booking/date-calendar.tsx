"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTH_LABEL = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/**
 * A real month-grid calendar for picking a show date, replacing the plain
 * dropdown — only dates that actually have a show (from `availableDates`)
 * are clickable; everything else is shown dim and disabled.
 */
export function DateCalendar({
  availableDates,
  value,
  onChange,
}: {
  availableDates: string[];
  value: string;
  onChange: (date: string) => void;
}) {
  const available = useMemo(() => new Set(availableDates), [availableDates]);
  const sorted = useMemo(() => [...availableDates].sort(), [availableDates]);
  const firstAvailable = sorted[0] ? toDate(sorted[0]) : new Date();
  const lastAvailable = sorted[sorted.length - 1] ? toDate(sorted[sorted.length - 1]) : firstAvailable;

  const [cursor, setCursor] = useState(() => (value ? toDate(value) : firstAvailable));

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  // Monday-first offset (0 = Monday).
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const canGoPrev = monthKey(cursor) > monthKey(firstAvailable);
  const canGoNext = monthKey(cursor) < monthKey(lastAvailable);

  const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function isoFor(day: number): string {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="flex size-8 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-accent/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="text-sm font-bold capitalize text-ink">{MONTH_LABEL.format(cursor)}</p>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="flex size-8 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-accent/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
            {w}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} />;
          const iso = isoFor(day);
          const isAvailable = available.has(iso);
          const isSelected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              disabled={!isAvailable}
              onClick={() => onChange(iso)}
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                isSelected
                  ? "bg-accent text-canvas"
                  : isAvailable
                    ? "text-ink hover:bg-accent-soft hover:text-accent"
                    : "cursor-not-allowed text-muted/30",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[0.6875rem] text-muted">Tanggal terang menandakan ada show tersedia.</p>
    </div>
  );
}
