import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Mirrors db/schema.sql, which stays the source of truth for the database:
 * it also holds every SQL function the app calls (create_booking with its
 * row-locking auto-routing, admin_mark_paid, ...), which an ORM can't
 * express. Update both together. Dates/times use `mode: "string"` so the UI
 * always gets plain "YYYY-MM-DD" / "HH:MM:SS" strings.
 */

export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  includes: text("includes").array().notNull().default([]),
  price: numeric("price").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    email: text("email").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("customers_whatsapp_idx").on(t.whatsapp)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionDate: date("session_date", { mode: "string" }).notNull(),
    slotIndex: integer("slot_index").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    capacity: integer("capacity").notNull().default(13),
    seatsTaken: integer("seats_taken").notNull().default(0),
  },
  (t) => [unique().on(t.sessionDate, t.slotIndex), index("sessions_date_idx").on(t.sessionDate, t.slotIndex)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Defaults (booking_number, access_token) are set by the database itself.
    bookingNumber: text("booking_number").notNull().unique(),
    accessToken: uuid("access_token").notNull().unique(),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    sessionId: uuid("session_id").notNull().references(() => sessions.id),
    packageId: text("package_id").notNull().references(() => packages.id),
    seats: integer("seats").notNull(),
    amount: numeric("amount").notNull().default("0"),
    status: text("status").notNull().default("PENDING"),
    paymentStatus: text("payment_status").notNull().default("PENDING"),
    checkinStatus: text("checkin_status").notNull().default("NOT_CHECKED_IN"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: "string" }),
    autoRouted: boolean("auto_routed").notNull().default(false),
    requestedSessionId: uuid("requested_session_id").references(() => sessions.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("bookings_customer_idx").on(t.customerId), index("bookings_session_idx").on(t.sessionId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentNumber: text("payment_number").notNull().unique(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    amount: numeric("amount").notNull().default("0"),
    method: text("method").notNull().default("TRANSFER"),
    status: text("status").notNull().default("PENDING"),
    provider: text("provider").notNull().default("Transfer bank (verifikasi manual)"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    proofSubmittedAt: timestamp("proof_submitted_at", { withTimezone: true, mode: "string" }),
    proofDataUrl: text("proof_data_url"),
  },
  (t) => [index("payments_booking_idx").on(t.bookingId)],
);

export const cmsContent = pgTable("cms_content", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const numberCounters = pgTable(
  "number_counters",
  {
    scope: text("scope").notNull(),
    year: integer("year").notNull(),
    value: integer("value").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.scope, t.year] })],
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  session: one(sessions, { fields: [bookings.sessionId], references: [sessions.id] }),
  package: one(packages, { fields: [bookings.packageId], references: [packages.id] }),
  payments: many(payments),
}));
export const customersRelations = relations(customers, ({ many }) => ({ bookings: many(bookings) }));
export const sessionsRelations = relations(sessions, ({ many }) => ({ bookings: many(bookings) }));
export const packagesRelations = relations(packages, ({ many }) => ({ bookings: many(bookings) }));
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));
