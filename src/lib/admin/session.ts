/**
 * Admin session: a single shared password (ADMIN_PASSWORD) exchanged for a
 * short-lived HMAC-signed cookie (ADMIN_SESSION_SECRET). Uses Web Crypto so
 * the same code runs in both the Edge middleware and Node server actions.
 *
 * Fails closed: if either env var is missing, no one can sign in.
 */

export const ADMIN_COOKIE = "hlm_admin";
export const SESSION_HOURS = 12;

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

/** Constant-time string comparison via digest, so length/prefix don't leak. */
export async function passwordMatches(candidate: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET belum diisi.");
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiresAt);
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;
  const [payload, signatureHex] = token.split(".");
  if (!payload || !signatureHex) return false;
  if (!(Number(payload) > Date.now())) return false;

  const expected = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return toHex(expected) === signatureHex;
}
