import "server-only";
import { getSql } from "@/lib/db/client";

/* Read-side queries for the /admin area. Every date/time is selected as text
   (see db/schema.sql) so the UI never has to reason about driver parsing. */

export type BookingFilter = "ALL" | "PENDING" | "PAID" | "CANCELLED" | "CHECKED_IN";

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

function toBookingRow(r: Record<string, unknown>): AdminBookingRow {
  return {
    id: r.id as string,
    bookingNumber: r.booking_number as string,
    status: r.status as string,
    paymentStatus: r.payment_status as string,
    checkinStatus: r.checkin_status as string,
    seats: Number(r.seats),
    amount: Number(r.amount),
    autoRouted: Boolean(r.auto_routed),
    createdAt: r.created_at as string,
    sessionDate: r.session_date as string,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    packageName: r.package_name as string,
    customerName: r.full_name as string,
    whatsapp: r.whatsapp as string,
    email: r.email as string,
  };
}

const BOOKING_SELECT = `
  select b.id, b.booking_number, b.status, b.payment_status, b.checkin_status,
         b.seats, b.amount, b.auto_routed,
         b.created_at::text as created_at,
         s.session_date::text as session_date, s.start_time::text as start_time, s.end_time::text as end_time,
         pk.name as package_name,
         c.full_name, c.whatsapp, c.email
  from bookings b
  join sessions s on s.id = b.session_id
  join packages pk on pk.id = b.package_id
  join customers c on c.id = b.customer_id
`;

export async function listBookings(filter: BookingFilter, query: string): Promise<AdminBookingRow[]> {
  const sql = getSql();
  const needle = `%${query.trim()}%`;
  const rows = await sql.query(
    `${BOOKING_SELECT}
     where ($1 = 'ALL'
            or ($1 = 'PENDING' and b.payment_status = 'PENDING' and b.status <> 'CANCELLED')
            or ($1 = 'PAID' and b.payment_status = 'PAID')
            or ($1 = 'CANCELLED' and b.status = 'CANCELLED')
            or ($1 = 'CHECKED_IN' and b.checkin_status = 'CHECKED_IN'))
       and ($2 = '%%' or b.booking_number ilike $2 or c.full_name ilike $2 or c.whatsapp ilike $2)
     order by b.created_at desc
     limit 300`,
    [filter, needle],
  );
  return rows.map(toBookingRow);
}

export async function findBookingByNumber(bookingNumber: string): Promise<AdminBookingRow | null> {
  const sql = getSql();
  const rows = await sql.query(`${BOOKING_SELECT} where upper(b.booking_number) = upper($1)`, [
    bookingNumber.trim(),
  ]);
  return rows[0] ? toBookingRow(rows[0]) : null;
}

export async function getBookingById(id: string): Promise<AdminBookingRow | null> {
  const sql = getSql();
  const rows = await sql.query(`${BOOKING_SELECT} where b.id = $1`, [id]);
  return rows[0] ? toBookingRow(rows[0]) : null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const sql = getSql();
  const [row] = await sql`
    select
      count(*) filter (where status <> 'CANCELLED')::int as active_bookings,
      count(*) filter (where payment_status = 'PAID')::int as paid_bookings,
      count(*) filter (where payment_status = 'PENDING' and status <> 'CANCELLED')::int as pending_payments,
      coalesce(sum(amount) filter (where payment_status = 'PAID'), 0)::text as revenue,
      coalesce(sum(seats) filter (where status <> 'CANCELLED'), 0)::int as seats_sold,
      count(*) filter (where auto_routed and status <> 'CANCELLED')::int as auto_routed,
      count(*) filter (where checkin_status = 'CHECKED_IN')::int as checked_in
    from bookings
  `;
  return {
    activeBookings: row.active_bookings,
    paidBookings: row.paid_bookings,
    pendingPayments: row.pending_payments,
    revenue: Number(row.revenue),
    seatsSold: row.seats_sold,
    autoRouted: row.auto_routed,
    checkedIn: row.checked_in,
  };
}

export async function listSessions(): Promise<SessionRow[]> {
  const sql = getSql();
  const rows = await sql`select * from session_availability order by session_date, slot_index`;
  return rows.map((r) => ({
    id: r.id,
    sessionDate: r.session_date,
    slotIndex: r.slot_index,
    startTime: r.start_time,
    endTime: r.end_time,
    capacity: r.capacity,
    seatsTaken: r.seats_taken,
    seatsLeft: r.seats_left,
  }));
}

export async function listAllPackages(): Promise<PackageRow[]> {
  const sql = getSql();
  const rows = await sql`select id, name, description, price, active, sort_order, includes from packages order by sort_order`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    active: r.active,
    sortOrder: r.sort_order,
    includes: r.includes ?? [],
  }));
}

export async function listCustomers(): Promise<CustomerRow[]> {
  const sql = getSql();
  const rows = await sql`
    select c.id, c.full_name, c.whatsapp, c.email, c.created_at::text as created_at,
           count(b.id) filter (where b.status <> 'CANCELLED')::int as booking_count,
           coalesce(sum(b.amount) filter (where b.payment_status = 'PAID'), 0)::text as paid_total
    from customers c
    left join bookings b on b.customer_id = c.id
    group by c.id
    order by c.created_at desc
    limit 300
  `;
  return rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    whatsapp: r.whatsapp,
    email: r.email,
    createdAt: r.created_at,
    bookingCount: r.booking_count,
    paidTotal: Number(r.paid_total),
  }));
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
  const sql = getSql();
  const rows = await sql`
    select pk.name as package_name,
           count(b.id)::int as bookings,
           coalesce(sum(b.seats), 0)::int as seats,
           coalesce(sum(b.amount) filter (where b.payment_status = 'PAID'), 0)::text as revenue
    from packages pk
    left join bookings b on b.package_id = pk.id and b.status <> 'CANCELLED'
    group by pk.id, pk.name, pk.sort_order
    order by pk.sort_order
  `;
  return rows.map((r) => ({
    packageName: r.package_name,
    bookings: r.bookings,
    seats: r.seats,
    revenue: Number(r.revenue),
  }));
}

export async function reportByDate(): Promise<ReportByDate[]> {
  const sql = getSql();
  const rows = await sql`
    select s.session_date::text as session_date,
           coalesce(sum(b.seats) filter (where b.status <> 'CANCELLED'), 0)::int as seats_sold,
           coalesce(sum(s.capacity), 0)::int as capacity,
           coalesce(sum(b.amount) filter (where b.payment_status = 'PAID'), 0)::text as revenue
    from sessions s
    left join bookings b on b.session_id = s.id
    group by s.session_date
    order by s.session_date
  `;
  return rows.map((r) => ({
    sessionDate: r.session_date,
    seatsSold: r.seats_sold,
    capacity: r.capacity,
    revenue: Number(r.revenue),
  }));
}

export async function allBookingsForExport(): Promise<AdminBookingRow[]> {
  const sql = getSql();
  const rows = await sql.query(`${BOOKING_SELECT} order by b.created_at asc`, []);
  return rows.map(toBookingRow);
}
