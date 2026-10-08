const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** "Rp75.000" — tanpa spasi, sama dengan hololabs-id. */
export function formatRupiah(value: number): string {
  return RUPIAH.format(value).replace(/\s/g, "");
}

// Tanggal show berupa "YYYY-MM-DD" tanpa zona; dipatok ke WIB supaya hari
// yang tampil tidak bergeser di perangkat yang zonanya berbeda.
const at = (iso: string) => new Date(`${iso}T00:00:00+07:00`);

const LONG = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const WEEKDAY = new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: "Asia/Jakarta" });

export function formatDate(iso: string): string {
  return LONG.format(at(iso));
}

export function formatWeekday(iso: string): string {
  return WEEKDAY.format(at(iso));
}

/** "18:00 – 19:30 WIB" */
export function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)} WIB`;
}
