/**
 * Menyiapkan basis data dan akun Super Admin pertama.
 *
 *   DATABASE_URL="postgres://..." \
 *   ADMIN_EMAIL="you@hololabs.id" ADMIN_PASSWORD="..." ADMIN_NAME="Nama" \
 *   node scripts/setup.mjs
 *
 * Aman dijalankan berulang: skema memakai IF NOT EXISTS, dan akun yang sudah
 * ada hanya diperbarui kata sandinya bila ADMIN_PASSWORD diisi.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL belum diisi.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
});

await client.connect();

const schema = readFileSync(join(here, "..", "supabase", "schema.sql"), "utf8");
await client.query(schema);
console.log("✓ Skema dijalankan");

const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME ?? "Super Admin";

if (email && password) {
  if (password.length < 10) {
    console.error("ADMIN_PASSWORD minimal 10 karakter.");
    await client.end();
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await client.query(
    `insert into users (email, name, password_hash, role)
     values ($1, $2, $3, 'SUPER_ADMIN')
     on conflict (email) do update
       set password_hash = excluded.password_hash,
           name = excluded.name,
           role = 'SUPER_ADMIN',
           is_active = true,
           failed_attempts = 0,
           locked_until = null`,
    [email, name, hash],
  );
  console.log(`✓ Super Admin siap: ${email}`);
} else {
  console.log("• ADMIN_EMAIL/ADMIN_PASSWORD tidak diisi, akun dilewati.");
}

const { rows } = await client.query("select count(*)::int as n from users");
console.log(`• Total akun admin: ${rows[0].n}`);

await client.end();
