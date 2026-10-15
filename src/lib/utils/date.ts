const LONG = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const WEEKDAY = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  timeZone: "Asia/Jakarta",
});

const WEEKDAY_SHORT = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  timeZone: "Asia/Jakarta",
});

const DAY_MONTH = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Jakarta",
});

export function formatDate(iso: string): string {
  return LONG.format(new Date(`${iso}T00:00:00`));
}

export function formatWeekday(iso: string): string {
  return WEEKDAY.format(new Date(`${iso}T00:00:00`));
}

export function formatWeekdayShort(iso: string): string {
  return WEEKDAY_SHORT.format(new Date(`${iso}T00:00:00`));
}

export function formatDayMonth(iso: string): string {
  return DAY_MONTH.format(new Date(`${iso}T00:00:00`));
}

export function dateChip(iso: string): { day: string; month: string } {
  const date = new Date(`${iso}T00:00:00`);
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit", timeZone: "Asia/Jakarta" }).format(date),
    month: new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "Asia/Jakarta" })
      .format(date)
      .replace(".", ""),
  };
}
