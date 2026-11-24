import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { rows } from "@/lib/db/client";
import { getSiteContent } from "@/lib/cms";
import { getBookingById } from "@/lib/services/admin";
import type { AdminBookingRow } from "@/lib/services/admin";
import { formatDate, formatWeekday } from "@/lib/utils/date";
import { formatRupiah, formatTimeRange } from "@/lib/utils/format";
import { fillTemplate } from "@/lib/utils/eticket-message";
import { qrPng } from "@/lib/utils/qr";

/**
 * Automatic email through the Gmail account in `GMAIL_USER`, using Google's
 * SMTP server (smtp.gmail.com) with an App Password (`GMAIL_APP_PASSWORD`,
 * a 16-character code from the Google account's 2-Step Verification page; the
 * normal password does not work). Three messages go out without anyone
 * pressing send:
 *   1. "Selesaikan transfermu": account and exact amount, right after the order;
 *   2. "Sedang diverifikasi": when the guest reports the transfer;
 *   3. "E-ticket sudah siap": QR + link, once an admin confirms the payment.
 * Without the two variables nothing is sent and the admin sees a clear
 * message instead.
 */

export type MailResult = { ok: true } | { ok: false; error: string };

/** `MAIL_DRY_RUN=1` (local testing only): nothing is sent, each email is written as an .eml file in the system temp folder. */
const dryRun = () => process.env.MAIL_DRY_RUN === "1";

/**
 * Mail server. Any SMTP server through SMTP_HOST / SMTP_PORT / SMTP_USER /
 * SMTP_PASS (e.g. a domain mailbox such as noreply@hololabs.id on Hostinger:
 * smtp.hostinger.com, port 465); otherwise Gmail through GMAIL_USER +
 * GMAIL_APP_PASSWORD. MAIL_FROM (optional) overrides the sender address.
 */
function smtpSettings() {
  const env = process.env;
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    const port = Number(env.SMTP_PORT || 465);
    return { host: env.SMTP_HOST, port, secure: port === 465, user: env.SMTP_USER, pass: env.SMTP_PASS };
  }
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    return { host: "smtp.gmail.com", port: 465, secure: true, user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD.replace(/\s+/g, "") };
  }
  return null;
}

function senderAddress(): string {
  const from = process.env.MAIL_FROM?.trim();
  if (from) return from.includes("<") ? from : `"HOLOLABS" <${from}>`;
  return `"HOLOLABS" <${smtpSettings()?.user || "dry-run@hololabs.local"}>`;
}

export function emailConfigured(): boolean {
  return dryRun() || smtpSettings() !== null;
}

let transport: Transporter | null = null;
function getTransport() {
  if (dryRun()) return nodemailer.createTransport({ streamTransport: true, buffer: true });
  const cfg = smtpSettings();
  transport ??= nodemailer.createTransport({
    host: cfg?.host,
    port: cfg?.port,
    secure: cfg?.secure,
    auth: { user: cfg?.user, pass: cfg?.pass },
  });
  return transport;
}

/** Public address of the site, for links in emails: SITE_URL / NEXT_PUBLIC_SITE_URL, else the address of the current request. */
export async function siteOrigin(): Promise<string> {
  const fixed = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() || (host && /^(localhost|127\.|192\.168\.|10\.)/.test(host) ? "http" : "https");
  // a fixed address that is just the local default must not win over the real request address
  if (fixed && !/\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(fixed)) return fixed.replace(/\/$/, "");
  return host ? `${proto}://${host}` : (fixed ?? "").replace(/\/$/, "");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BG = "#07050f";
const CARD = "#0f0b1c";
const LINE = "#241d3d";
const MUTED = "#9a94b8";
const TEXT = "#f4f1ff";

function details(b: AdminBookingRow): [string, string][] {
  return [
    ["Kode pemesanan", b.bookingNumber],
    ["Jadwal", `${formatWeekday(b.sessionDate)}, ${formatDate(b.sessionDate)}, ${formatTimeRange(b.startTime, b.endTime)}`],
    ["Jumlah tiket", `${b.seats} orang`],
    ...(b.seatLabels?.length ? ([["Kursi", b.seatLabels.join(", ")]] as [string, string][]) : []),
    ["Total", formatRupiah(b.amount)],
  ];
}

function valuesFor(b: AdminBookingRow, extra: Record<string, string> = {}) {
  return {
    nama: b.customerName,
    booking: b.bookingNumber,
    link: "",
    jadwal: `${formatWeekday(b.sessionDate)}, ${formatDate(b.sessionDate)}, ${formatTimeRange(b.startTime, b.endTime)}`,
    kursi: b.seatLabels?.length ? `No. ${b.seatLabels.join(", ")}` : `${b.seats} orang`,
    jumlah: `${b.seats} orang`,
    ...extra,
  };
}

const button = (href: string, label: string) =>
  `<p style="margin:22px 0 6px"><a href="${esc(href)}" style="display:inline-block;background:#8b3df0;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px">${esc(label)}</a></p>`;

/** One dark card layout shared by all the emails; inline styles only, because mail clients ignore stylesheets. */
function layout(opts: { title: string; paragraphs: string[]; b: AdminBookingRow; blocks?: string; address: string }) {
  const rowsHtml = details(opts.b)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 0;color:${MUTED};font-size:14px;vertical-align:top">${esc(k)}</td><td align="right" style="padding:9px 0 9px 16px;color:${TEXT};font-size:14px;font-weight:700">${esc(v)}</td></tr>`,
    )
    .join("");
  const paras = opts.paragraphs.map((p) => `<p style="margin:0 0 14px;color:${TEXT};font-size:15px;line-height:1.65">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;padding:28px 12px;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:${CARD};border:1px solid ${LINE};border-radius:22px">
<tr><td style="padding:30px 28px 26px">
<p style="margin:0;color:#22d3ee;font-size:13px;letter-spacing:.3em;font-weight:700">HOLOLABS</p>
<h1 style="margin:12px 0 22px;color:#ffffff;font-size:26px;line-height:1.25">${esc(opts.title)}</h1>
${paras}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 0">${rowsHtml}</table>
${opts.blocks ?? ""}
</td></tr></table>
${opts.address ? `<p style="max-width:520px;margin:18px auto 0;color:${MUTED};font-size:12px;line-height:1.6;text-align:center">${esc(opts.address)}</p>` : ""}
</td></tr></table></body></html>`;
}

function plain(paragraphs: string[], b: AdminBookingRow, extraLines: string[] = []) {
  return `${paragraphs.join("\n\n")}\n\n${details(b).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${extraLines.join("\n")}\n`;
}

async function deliver(b: AdminBookingRow, subject: string, html: string, text: string, attachQr: boolean): Promise<MailResult> {
  if (!emailConfigured()) {
    return { ok: false, error: "Email otomatis belum aktif: isi SMTP_HOST, SMTP_USER, SMTP_PASS (atau GMAIL_USER dan GMAIL_APP_PASSWORD) di server, lalu jalankan ulang." };
  }
  if (!b.email) return { ok: false, error: "Tamu tidak mengisi email." };
  try {
    const attachments = attachQr ? [{ filename: "qr-checkin.png", content: await qrPng(b.bookingNumber), cid: "qr-checkin", contentType: "image/png" }] : [];
    const info = await getTransport().sendMail({
      from: senderAddress(),
      to: b.email,
      subject,
      text,
      html,
      attachments,
    });
    if (dryRun()) {
      const dir = join(tmpdir(), "hololabs-mail");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${Date.now()}-${b.bookingNumber}.eml`), (info as unknown as { message: Buffer }).message);
    }
    return { ok: true };
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : "";
    if (/Invalid login|Username and Password not accepted|535/i.test(msg)) {
      return { ok: false, error: process.env.SMTP_HOST ? "Server email menolak login. Periksa SMTP_USER dan SMTP_PASS." : "Gmail menolak login. Pastikan GMAIL_APP_PASSWORD adalah App Password 16 karakter (bukan password biasa)." };
    }
    return { ok: false, error: "Email gagal terkirim. Coba lagi sebentar lagi." };
  }
}

/** "24 Nov 2026, 12.32" in Jakarta time, the way the guest reads it. */
function formatDeadline(iso: string) {
  const parts = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}.${get("minute")}`;
}

const oneAddress = (address: string) =>
  address
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(", ");

/** 1. "Selesaikan transfermu": the account, the exact amount and the deadline, right after the order. */
export async function sendPaymentInstructionsEmail(bookingId: string): Promise<MailResult> {
  const b = await getBookingById(bookingId);
  if (!b) return { ok: false, error: "Booking tidak ditemukan." };
  if (!b.email) return { ok: false, error: "Tamu tidak mengisi email." };
  const [{ eticket, booking: cfg, contact }, origin, [pay]] = await Promise.all([
    getSiteContent(),
    siteOrigin(),
    rows<{ expires_at: string }>(sql`select expires_at from payments where booking_id = ${bookingId}::uuid order by created_at desc limit 1`),
  ]);
  const link = `${origin}/pembayaran/${b.accessToken}`;
  const deadline = pay?.expires_at ? `${formatDeadline(pay.expires_at)} WIB` : "batas waktu yang tertera di halaman pembayaran";
  const values = valuesFor(b, { batas: deadline, link });
  const subject = fillTemplate(eticket.instructSubject, values);
  const paragraphs = fillTemplate(eticket.instructBody, values).split(/\n{2,}/);
  const nominal = formatRupiah(b.amount);
  const blocks = `
<p style="margin:26px 0 6px;color:${TEXT};font-size:14px">Transfer ke rekening ${esc(cfg.bank)}</p>
<p style="margin:0;color:#67e8f9;font-size:30px;font-weight:800;letter-spacing:.04em">${esc(cfg.accountNumber || "(nomor rekening belum diisi)")}</p>
<p style="margin:6px 0 0;color:${MUTED};font-size:14px">a.n. <b style="color:${TEXT}">${esc(cfg.holder)}</b></p>
<p style="margin:22px 0 4px;color:${TEXT};font-size:14px">Nominal (harus persis, termasuk 3 digit terakhir)</p>
<p style="margin:0;color:#ffffff;font-size:28px;font-weight:800">${esc(nominal)}</p>
${button(link, "Saya sudah transfer")}
<p style="margin:14px 0 0;color:${MUTED};font-size:13px;line-height:1.6">Setelah transfer, buka tautan di atas dan tekan "Saya sudah transfer". E-tiket dikirim setelah pembayaran diverifikasi tim HOLOLABS.</p>`;
  return deliver(
    b,
    subject,
    layout({ title: "Selesaikan transfermu", paragraphs, b, blocks, address: oneAddress(contact.address) }),
    plain(paragraphs, b, [`Transfer ke ${cfg.bank} ${cfg.accountNumber} a.n. ${cfg.holder}`, `Nominal: ${nominal}`, link]),
    false,
  );
}

/** 2. "Sedang diverifikasi": goes to the guest when they report the transfer. */
export async function sendVerificationEmail(bookingId: string): Promise<MailResult> {
  const b = await getBookingById(bookingId);
  if (!b) return { ok: false, error: "Booking tidak ditemukan." };
  if (!b.email) return { ok: false, error: "Tamu tidak mengisi email." };
  const [{ eticket, contact }, origin] = await Promise.all([getSiteContent(), siteOrigin()]);
  const link = `${origin}/pembayaran/${b.accessToken}`;
  const values = valuesFor(b, { link });
  const subject = fillTemplate(eticket.verifySubject, values);
  const paragraphs = fillTemplate(eticket.verifyBody, values).split(/\n{2,}/);
  const result = await deliver(
    b,
    subject,
    layout({ title: "Kami sedang memverifikasi pembayaranmu", paragraphs, b, blocks: button(link, "Lihat status pesanan"), address: oneAddress(contact.address) }),
    plain(paragraphs, b, [link]),
    false,
  );
  if (result.ok) await rows(sql`update bookings set payment_notice_email_at = now() where id = ${bookingId}::uuid`);
  return result;
}

/** 3. "E-ticket sudah siap": QR + link + location; the send time is recorded on the booking. */
export async function sendETicketEmail(bookingId: string): Promise<MailResult> {
  const b = await getBookingById(bookingId);
  if (!b) return { ok: false, error: "Booking tidak ditemukan." };
  if (b.paymentStatus !== "PAID" || b.status === "CANCELLED") return { ok: false, error: "E-tiket hanya dikirim untuk pesanan yang sudah lunas." };
  const [{ eticket, contact }, origin] = await Promise.all([getSiteContent(), siteOrigin()]);
  const link = `${origin}/e-tiket/${b.accessToken}`;
  const values = valuesFor(b, { link });
  const subject = fillTemplate(eticket.emailSubject, values);
  const paragraphs = fillTemplate(eticket.emailBody, values).split(/\n{2,}/);
  const address = oneAddress(contact.address);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const blocks = `
<div style="margin:26px 0 0;text-align:center"><div style="display:inline-block;background:#ffffff;border-radius:16px;padding:14px"><img src="cid:qr-checkin" width="200" height="200" alt="QR check-in ${esc(b.bookingNumber)}" style="display:block"></div>
<p style="margin:12px 0 0;color:${TEXT};font-size:14px">Tunjukkan QR ini di pintu masuk. Datang 10 menit sebelum pertunjukan.</p></div>
<p style="margin:0;text-align:left">${button(link, "Buka e-tiket").replace("margin:22px 0 6px", "margin:20px 0 6px")}</p>
${address ? `<p style="margin:18px 0 0;color:${TEXT};font-size:14px;line-height:1.6">Lokasi: ${esc(address)}<br><a href="${esc(maps)}" style="color:#67e8f9">Buka di Google Maps</a></p>` : ""}`;
  const result = await deliver(
    b,
    subject,
    layout({ title: "E-tiket kamu sudah siap", paragraphs, b, blocks, address }),
    plain(paragraphs, b, [`E-tiket: ${link}`, address ? `Lokasi: ${address}` : "", address ? maps : ""].filter(Boolean)),
    true,
  );
  if (result.ok) await rows(sql`update bookings set ticket_sent_email_at = now() where id = ${bookingId}::uuid`);
  return result;
}
