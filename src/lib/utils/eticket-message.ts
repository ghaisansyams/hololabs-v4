/** Replaces {nama}, {booking}, {link}, {jadwal}, {kursi}, {jumlah} and {batas} in an email template. */
export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(nama|booking|link|jadwal|kursi|jumlah|batas)\}/g, (_, key: string) => values[key] ?? "");
}
