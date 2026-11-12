import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit is only used for tooling here (Drizzle Studio, and
 * `drizzle-kit pull` to compare against the live database). The database
 * itself is created from db/schema.sql, which also holds the SQL functions
 * the booking engine relies on, so don't run `drizzle-kit push` against it.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
