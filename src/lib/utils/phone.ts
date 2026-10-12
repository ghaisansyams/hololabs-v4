/** "0812…", "+62812…", "62812…" -> "62812…" (the form wa.me expects). */
export function toWhatsappE164(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}
