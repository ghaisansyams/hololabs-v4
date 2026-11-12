import "server-only";
import { and, asc, desc, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb, rows, schema } from "@/lib/db/client";

/* Read-side queries for the /admin area, on Drizzle: the query builder for
   the joins and lists, raw `sql` for the aggregates. Dates and times are
   plain strings (the schema uses string mode and the pool returns raw text),
   so the UI never has to reason about driver parsing. */

export type BookingFilter = "ALL" | "PENDING" | "SUBMITTED" | "PAID" | "CANCELLED" | "CHECKED_IN";

export interface AdminBookingRow {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  checkinStatus: string;
  seats: number;
  amount: number;
  autoRouted: boolean;
  createdAt: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  packageName: string;
  customerName: string;
  whatsapp: string;
  email: string;
  paymentMethod: string | null;
  proofDataUrl: string | null;
  proofSubmittedAt: string | null;
}

export interface DashboardStats {
  activeBookings: number;
  paidBookings: number;
  pendingPayments: number;
  revenue: number;
  seatsSold: number;
  autoRouted: number;
  checkedIn: number;
}

export interface SessionRow {
  id: string;
  sessionDate: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
  capacity: number;
  seatsTaken: number;
  seatsLeft: number;
}

export interface PackageRow {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  sortOrder: number;
  includes: string[];
}

export interface CustomerRow {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string;
  createdAt: string;
  bookingCount: number;
  paidTotal: number;
}

const { bookings: b, sessions: s, packages: pk, customers: c, payments: p } = schema;

const bookingColumns = {
  id: b.id,
  bookingNumber: b.bookingNumber,
  status: b.status,
  paymentStatus: b.paymentStatus,
  checkinStatus: b.checkinStatus,
  seats: b.seats,
  amount: b.amount,
  autoRouted: b.autoRouted,
  createdAt: b.createdAt,
  sessionDate: s.sessionDate,
  startTime: s.startTime,
  endTime: s.endTime,
  packageName: pk.name,
  customerName: c.fullName,
  whatsapp: c.whatsapp,
  email: c.email,
  paymentMethod: p.method,
  proofDataUrl: p.proofDataUrl,
  proofSubmittedAt: p.proofSubmittedAt,
};

function bookingQuery() {
  return getDb()
    .select(bookingColumns)
    .from(b)
    .innerJoin(s, eq(s.id, b.sessionId))
    .innerJoin(pk, eq(pk.id, b.packageId))
    .innerJoin(c, eq(c.id, b.customerId))
    .leftJoin(p, eq(p.bookingId, b.id));
}

type BookingResult = Awaited<ReturnType<ReturnType<typeof bookingQuery>["limit"]>>[number];

function toBookingRow(r: BookingResult): AdminBookingRow {
  return { ...r, amount: Number(r.amount) };
}

function filterCondition(filter: BookingFilter): SQL | undefined {
  switch (filter) {
    case "PENDING":
      return and(eq(b.paymentStatus, "PENDING"), ne(b.status, "CANCELLED"));
    case "SUBMITTED":
      return and(eq(b.paymentStatus, "SUBMITTED"), ne(b.status, "CANCELLED"));
    case "PAID":
      return eq(b.paymentStatus, "PAID");
    case "CANCELLED":
      return eq(b.status, "CANCELLED");
    case "CHECKED_IN":
      return eq(b.checkinStatus, "CHECKED_IN");
    default:
      return undefined;
  }
}

export async function listBookings(filter: BookingFilter, query: string): Promise<AdminBookingRow[]> {
  const needle = `%${query.trim()}%`;
  const search =
    needle === "%%" ? undefined : or(ilike(b.bookingNumber, needle), ilike(c.fullName, needle), ilike(c.whatsapp, needle));
  const list = await bookingQuery()
    .where(and(filterCondition(filter), search))
    .orderBy(desc(b.createdAt))
    .limit(300);
  return list.map(toBookingRow);
}

export async function findBookingByNumber(bookingNumber: string): Promise<AdminBookingRow | null> {
  const [row] = await bookingQuery()
    .where(sql`upper(${b.bookingNumber}) = upper(${bookingNumber.trim()})`)
    .limit(1);
  return row ? toBookingRow(row) : null;
}

export async function getBookingById(id: string): Promise<AdminBookingRow | null> {
  const [row] = await bookingQuery().where(eq(b.id, id)).limit(1);
  return row ? toBookingRow(row) : null;
}

export async function allBookingsForExport(): Promise<AdminBookingRow[]> {
  const list = await bookingQuery().orderBy(asc(b.createdAt));
  return list.map(toBookingRow);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [row] = await rows<Record<string, number | string>>(sql`
    select
      count(*) filter (where status <> 'CANCELLED')::int as active_bookings,
      count(*) filter (where payment_status = 'PAID')::int as paid_bookings,
      count(*) filter (where payment_status = 'PENDING' and status <> 'CANCELLED')::int as pending_payments,
      coalesce(sum(amount) filter (where payment_status = 'PAID'), 0)::text as revenue,
      coalesce(sum(seats) filter (where status <> 'CANCELLED'), 0)::int as seats_sold,
      count(*) filter (where auto_routed and status <> 'CANCELLED')::int as auto_routed,
      count(*) filter (where checkin_status = 'CHECKED_IN')::int as checked_in
    from bookings
  `);
  return {
    activeBookings: Number(row.active_bookings),
    paidBookings: Number(row.paid_bookings),
    pendingPayments: Number(row.pending_payments),
    revenue: Number(row.revenue),
    seatsSold: Number(row.seats_sold),
    autoRouted: Number(row.auto_routed),
    checkedIn: Number(row.checked_in),
  };
}

export async function listSessions(): Promise<SessionRow[]> {
  const list = await rows<Record<string, string | number>>(
    sql`select * from session_availability order by session_date, slot_index`,
  );
  return list.map((r) => ({
    id: r.id as string,
    sessionDate: r.session_date as string,
    slotIndex: Number(r.slot_index),
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    capacity: Number(r.capacity),
    seatsTaken: Number(r.seats_taken),
    seatsLeft: Number(r.seats_left),
  }));
}

export async function listAllPackages(): Promise<PackageRow[]> {
  const list = await getDb().select().from(pk).orderBy(asc(pk.sortOrder));
  return list.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    active: r.active,
    sortOrder: r.sortOrder,
    includes: r.includes,
  }));
}

export async function listCustomers(): Promise<CustomerRow[]> {
  const list = await getDb()
    .select({
      id: c.id,
      fullName: c.fullName,
      whatsapp: c.whatsapp,
      email: c.email,
      createdAt: c.createdAt,
      bookingCount: sql<number>`count(${b.id}) filter (where ${b.status} <> 'CANCELLED')::int`,
      paidTotal: sql<string>`coalesce(sum(${b.amount}) filter (where ${b.paymentStatus} = 'PAID'), 0)::text`,
    })
    .from(c)
    .leftJoin(b, eq(b.customerId, c.id))
    .groupBy(c.id)
    .orderBy(desc(c.createdAt))
    .limit(300);
  return list.map((r) => ({ ...r, bookingCount: Number(r.bookingCount), paidTotal: Number(r.paidTotal) }));
}

export interface ReportByPackage {
  packageName: string;
  bookings: number;
  seats: number;
  revenue: number;
}

export interface ReportByDate {
  sessionDate: string;
  seatsSold: number;
  capacity: number;
  revenue: number;
}

export async function reportByPackage(): Promise<ReportByPackage[]> {
  const list = await getDb()
    .select({
      packageName: pk.name,
      bookings: sql<number>`count(${b.id})::int`,
      seats: sql<number>`coalesce(sum(${b.seats}), 0)::int`,
      revenue: sql<string>`coalesce(sum(${b.amount}) filter (where ${b.paymentStatus} = 'PAID'), 0)::text`,
    })
    .from(pk)
    .leftJoin(b, and(eq(b.packageId, pk.id), ne(b.status, "CANCELLED")))
    .groupBy(pk.id, pk.name, pk.sortOrder)
    .orderBy(asc(pk.sortOrder));
  return list.map((r) => ({ ...r, bookings: Number(r.bookings), seats: Number(r.seats), revenue: Number(r.revenue) }));
}

export async function reportByDate(): Promise<ReportByDate[]> {
  const list = await getDb()
    .select({
      sessionDate: s.sessionDate,
      seatsSold: sql<number>`coalesce(sum(${b.seats}) filter (where ${b.status} <> 'CANCELLED'), 0)::int`,
      capacity: sql<number>`coalesce(sum(${s.capacity}), 0)::int`,
      revenue: sql<string>`coalesce(sum(${b.amount}) filter (where ${b.paymentStatus} = 'PAID'), 0)::text`,
    })
    .from(s)
    .leftJoin(b, eq(b.sessionId, s.id))
    .groupBy(s.sessionDate)
    .orderBy(asc(s.sessionDate));
  return list.map((r) => ({
    ...r,
    seatsSold: Number(r.seatsSold),
    capacity: Number(r.capacity),
    revenue: Number(r.revenue),
  }));
}
