import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

import { getSql, requireSql } from "./db";
import { recordAudit } from "./audit";

export type Role = "CONTENT_ADMIN" | "SUPER_ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const COOKIE = "holo_session";
/** PRD bagian 8: sesi berlaku 8 jam. */
const MAX_AGE_SECONDS = 8 * 60 * 60;
const LOCK_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET wajib diisi, minimal 32 karakter.");
  }
  return new TextEncoder().encode(value);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

/**
 * Login.
 *
 * Pesan galatnya sengaja sama untuk email tidak dikenal dan kata sandi salah:
 * membedakan keduanya memberi tahu penyerang email mana yang terdaftar.
 */
export async function signIn(email: string, password: string, ip?: string | null) {
  const sql = requireSql();
  const rows = (await sql`
    select id, email, name, password_hash, role, is_active, failed_attempts, locked_until
    from users where email = ${email.toLowerCase().trim()}
  `) as Record<string, unknown>[];

  const generic = { ok: false as const, message: "Email atau kata sandi salah." };
  const user = rows[0];
  if (!user) {
    await bcrypt.compare(password, "$2a$12$" + "x".repeat(53)).catch(() => false);
    return generic;
  }

  if (!user.is_active) {
    return { ok: false as const, message: "Akun dinonaktifkan. Hubungi Super Admin." };
  }

  const lockedUntil = user.locked_until ? new Date(user.locked_until as string) : null;
  if (lockedUntil && lockedUntil > new Date()) {
    const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
    return {
      ok: false as const,
      message: `Akun terkunci. Coba lagi dalam ${minutes} menit.`,
    };
  }

  const valid = await bcrypt.compare(password, String(user.password_hash));
  if (!valid) {
    const attempts = Number(user.failed_attempts ?? 0) + 1;
    const lock = attempts >= MAX_ATTEMPTS;
    await sql`
      update users set
        failed_attempts = ${lock ? 0 : attempts},
        locked_until = ${lock ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null}
      where id = ${user.id as string}
    `;
    if (lock) {
      await recordAudit({
        userId: user.id as string,
        action: "LOGIN_LOCKED",
        entity: "users",
        entityId: String(user.id),
        ip,
      });
      return {
        ok: false as const,
        message: `Lima kali gagal. Akun terkunci ${LOCK_MINUTES} menit.`,
      };
    }
    return generic;
  }

  await sql`
    update users set failed_attempts = 0, locked_until = null, last_login_at = now()
    where id = ${user.id as string}
  `;

  const session: SessionUser = {
    id: String(user.id),
    email: String(user.email),
    name: String(user.name),
    role: user.role as Role,
  };

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  await recordAudit({
    userId: session.id,
    action: "LOGIN",
    entity: "users",
    entityId: session.id,
    ip,
  });

  return { ok: true as const, user: session };
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Sesi saat ini, atau null. Tidak pernah melempar. */
export async function getSession(): Promise<SessionUser | null> {
  if (!getSql()) return null;
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
    };
  } catch {
    // Token kedaluwarsa, rusak, atau ditandatangani kunci lama.
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  return session;
}
