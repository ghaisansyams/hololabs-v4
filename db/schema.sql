-- Hololabs Exhibition — Booking Engine shared database (plain Postgres)
--
-- Run this once against your Postgres database — `psql "$DATABASE_URL" -f
-- db/schema.sql`, or paste the whole file into whatever SQL console your
-- host provides. Safe to re-run: everything is IF NOT EXISTS / CREATE OR
-- REPLACE.
--
-- Security model: every query in this app runs server-side only (Next.js
-- Server Components and Server Actions — see src/lib/db/client.ts), using
-- the single connection string from `DATABASE_URL`. That string is the only
-- secret; there is no separate anon/public key and no RLS, unlike a
-- Supabase-backed sibling project (Kelas Bermain) where the database is
-- reachable straight from the browser. Functions stay SECURITY DEFINER
-- mostly out of habit — harmless here since the connection role already
-- owns everything, but it keeps this schema portable back to Supabase later
-- if that's ever needed.
--
-- Domain, per the 16 Sept 2026 meeting notes (Spero x Hololabs):
--   - One exhibition, several days, 3 one-hour slots per day (18.00–21.00 WIB).
--   - Each slot ("session") holds at most 13 seats.
--   - A guest books N seats + one F&B package. If the slot they asked for
--     doesn't have N seats left, the system auto-routes them to the next
--     session (later that day, then later days) that does — see
--     `create_booking` below, which is the auto-routing rule from the notes.
--   - Payment is manual bank transfer (BCA/Mandiri, shown on the payment
--     page). No live payment-gateway integration is wired yet (no merchant
--     credentials were available while building this). The guest transfers
--     and taps "Saya Sudah Transfer" on the site itself — `submit_payment_proof`
--     below flips the booking to SUBMITTED (shown as "Menunggu konfirmasi",
--     same yellow pending look as an unpaid booking) — then an admin checks
--     the transfer in the bank account and confirms it from this project's
--     own admin panel (`admin_mark_paid`), which flips it to PAID. Nothing
--     here hands off to WhatsApp or any other institution's channel. Swap in
--     a real PG (Xendit/Midtrans) later by replacing the payment service and
--     adding its webhook — the schema doesn't need to change.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Sequences + number formatting
-- ------------------------------------------------------------------

create table if not exists number_counters (
  scope text not null,
  year int not null,
  value int not null default 0,
  primary key (scope, year)
);

create or replace function next_yearly_number(p_scope text, p_prefix text, p_year int)
returns text
language plpgsql
as $$
declare
  v_value int;
begin
  insert into number_counters (scope, year, value)
  values (p_scope, p_year, 1)
  on conflict (scope, year) do update set value = number_counters.value + 1
  returning value into v_value;
  return format('%s-%s-%s', p_prefix, p_year, lpad(v_value::text, 5, '0'));
end;
$$;

-- ------------------------------------------------------------------
-- packages (F&B bundles) — small, admin-editable catalogue
-- ------------------------------------------------------------------

create table if not exists packages (
  id text primary key,
  name text not null,
  description text not null default '',
  includes text[] not null default '{}',
  price numeric not null,
  sort_order int not null default 0,
  active boolean not null default true
);

insert into packages (id, name, description, includes, price, sort_order) values
  ('seat-only', 'Seat Only', 'Masuk pameran dan kursi tereservasi, tanpa paket F&B.',
    array['Akses show 1,5 jam', 'Kursi tereservasi'], 75000, 1),
  ('standard', 'Standard F&B', 'Kursi tereservasi plus satu paket makanan & minuman ringan.',
    array['Akses show 1,5 jam', 'Kursi tereservasi', '1 pilihan makanan (dimsum/tahu)', '1 pilihan minuman'], 150000, 2),
  ('premium', 'Premium F&B', 'Pengalaman lengkap: kursi terbaik dan sajian F&B tanpa batas selama sesi.',
    array['Akses show 1,5 jam', 'Kursi prioritas', 'Aneka makanan (dimsum, tahu, camilan lain)', 'Minuman bebas pilih & refill'], 250000, 3)
-- Seed only: once a package exists it's owned by the admin panel
-- (/admin/packages), and re-running this file must not revert its price.
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- sessions (the bookable slots)
-- ------------------------------------------------------------------

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  slot_index int not null,
  start_time time not null,
  end_time time not null,
  capacity int not null default 13,
  -- Maintained transactionally by create_booking (never by a trigger reading
  -- bookings), so the row itself can be locked with SELECT ... FOR UPDATE
  -- while checking capacity — see create_booking below.
  seats_taken int not null default 0,
  unique (session_date, slot_index)
);
create index if not exists sessions_date_idx on sessions (session_date, slot_index);

-- Seed the exhibition run once: 5 days, 2 one-and-a-half-hour shows per
-- day, 18.00–21.00 WIB, 13 seats per show (client's 7 Oct 2026 revision).
-- Only runs while the table is empty: after that the schedule is owned by
-- the admin panel (/admin/sessions), and re-running this file must never
-- overwrite what the team has set there.
insert into sessions (session_date, slot_index, start_time, end_time, capacity)
select d::date, times.slot, times.start_time, times.end_time, 13
from generate_series('2026-10-15'::date, '2026-10-19'::date, interval '1 day') as d
cross join (
  values (0, '18:00'::time, '19:30'::time),
         (1, '19:30'::time, '21:00'::time)
) as times(slot, start_time, end_time)
where not exists (select 1 from sessions)
on conflict (session_date, slot_index) do nothing;

-- ------------------------------------------------------------------
-- customers (whoever books — one row per WhatsApp number)
-- ------------------------------------------------------------------

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text not null,
  email text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists customers_whatsapp_idx on customers (whatsapp);

-- ------------------------------------------------------------------
-- bookings
-- ------------------------------------------------------------------

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text unique not null default
    next_yearly_number('booking', 'HLM-BOOK', extract(year from now())::int),
  -- Opaque, unguessable id for the public payment/e-ticket URLs — never the
  -- sequential booking_number, so it can't be walked to read someone else's
  -- booking (same reasoning as Kelas Bermain's access_token).
  access_token uuid not null default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete restrict,
  session_id uuid not null references sessions (id) on delete restrict,
  package_id text not null references packages (id),
  seats int not null check (seats > 0),
  amount numeric not null default 0,
  status text not null default 'PENDING',           -- PENDING | CONFIRMED | CANCELLED
  payment_status text not null default 'PENDING',   -- PENDING | PAID | EXPIRED | CANCELLED
  checkin_status text not null default 'NOT_CHECKED_IN', -- NOT_CHECKED_IN | CHECKED_IN
  checked_in_at timestamptz,
  -- True when the guest's originally requested session was full and the
  -- booking engine auto-routed them to the next available one.
  auto_routed boolean not null default false,
  requested_session_id uuid references sessions (id),
  created_at timestamptz not null default now()
);
create unique index if not exists bookings_access_token_idx on bookings (access_token);
create index if not exists bookings_session_idx on bookings (session_id);
create index if not exists bookings_customer_idx on bookings (customer_id);

-- ------------------------------------------------------------------
-- payments (bank transfer, manually verified for now — see header note)
-- status: PENDING (belum transfer) | SUBMITTED (sudah transfer, menunggu
-- konfirmasi admin) | PAID | EXPIRED | CANCELLED
-- ------------------------------------------------------------------

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  payment_number text unique not null default
    next_yearly_number('payment', 'HLM-PAY', extract(year from now())::int),
  booking_id uuid not null references bookings (id) on delete cascade,
  amount numeric not null default 0,
  method text not null default 'TRANSFER',
  status text not null default 'PENDING',
  provider text not null default 'Transfer bank (verifikasi manual)',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expires_at timestamptz,
  proof_submitted_at timestamptz,
  -- Guest-uploaded transfer screenshot, as a data: URL — small enough (capped
  -- client- and server-side, see submitPaymentProof) that a plain column
  -- beats standing up object storage for a demo flow.
  proof_data_url text
);
alter table payments add column if not exists proof_submitted_at timestamptz;
alter table payments add column if not exists proof_data_url text;
-- The table may already have existed with the old QRIS defaults (the
-- `create table if not exists` above only runs on a brand-new database).
alter table payments alter column method set default 'TRANSFER';
alter table payments alter column provider set default 'Transfer bank (verifikasi manual)';
update payments set method = 'TRANSFER' where method = 'QRIS';
update payments set provider = 'Transfer bank (verifikasi manual)' where provider = 'QRIS (verifikasi manual)';
create index if not exists payments_booking_idx on payments (booking_id);

-- ------------------------------------------------------------------
-- Availability view: seats left per session, computed live from bookings.
-- ------------------------------------------------------------------

-- Date/time columns are cast to text here (and in every function below that
-- returns one) so the app always gets plain "2026-10-15" / "18:00:00"
-- strings back, regardless of how a given Postgres client library parses
-- `date`/`time` — no ambiguity to reason about on the TypeScript side.
create or replace view session_availability as
select
  s.id, s.session_date::text as session_date, s.slot_index,
  s.start_time::text as start_time, s.end_time::text as end_time, s.capacity,
  s.seats_taken, s.capacity - s.seats_taken as seats_left
from sessions s;

create or replace function list_availability(p_from date default current_date)
returns setof session_availability
language sql security definer set search_path = public as $$
  select * from session_availability where session_date >= p_from::text
  order by session_date, slot_index;
$$;

-- ------------------------------------------------------------------
-- RPCs the public site calls
-- ------------------------------------------------------------------

create or replace function upsert_customer(
  p_full_name text, p_whatsapp text, p_email text
) returns customers
language plpgsql security definer set search_path = public as $$
declare
  v_customer customers;
begin
  select * into v_customer from customers where whatsapp = p_whatsapp limit 1;
  if v_customer.id is not null then
    update customers set full_name = p_full_name, email = coalesce(nullif(p_email, ''), email)
      where id = v_customer.id
      returning * into v_customer;
    return v_customer;
  end if;
  insert into customers (full_name, whatsapp, email)
  values (p_full_name, p_whatsapp, coalesce(p_email, ''))
  returning * into v_customer;
  return v_customer;
end;
$$;

-- Core booking + auto-routing rule. Locks candidate session rows
-- (FOR UPDATE) while checking capacity so two guests booking the last seats
-- at the same instant can never both succeed for the same slot.
--
-- Walk order: the requested session first, then every later session
-- (same day first, then later days) in chronological order — "kalau slot
-- ini penuh, majukan ke slot berikutnya yang masih cukup" exactly as
-- described in the meeting notes.
create or replace function create_booking(
  p_customer_id uuid, p_requested_session_id uuid, p_package_id text,
  p_seats int, p_amount numeric
) returns bookings
language plpgsql security definer set search_path = public as $$
declare
  v_requested sessions;
  v_candidate_id uuid;
  v_locked sessions;
  v_chosen_id uuid;
  v_auto_routed boolean := false;
  v_booking bookings;
begin
  select * into v_requested from sessions where id = p_requested_session_id;
  if v_requested.id is null then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Walk every session from the requested one onward, in chronological
  -- order, locking each candidate row before reading its capacity so two
  -- guests racing for the last seats of the same slot are serialized rather
  -- than both succeeding. The row we end up booking against stays locked
  -- until this transaction commits.
  for v_candidate_id in
    select s.id from sessions s
    where (s.session_date, s.slot_index) >= (v_requested.session_date, v_requested.slot_index)
    order by s.session_date, s.slot_index
  loop
    select * into v_locked from sessions where id = v_candidate_id for update;
    if v_locked.capacity - v_locked.seats_taken >= p_seats then
      v_chosen_id := v_locked.id;
      v_auto_routed := v_locked.id <> p_requested_session_id;
      exit;
    end if;
  end loop;

  if v_chosen_id is null then
    raise exception 'NO_AVAILABILITY' using errcode = 'P0005';
  end if;

  update sessions set seats_taken = seats_taken + p_seats where id = v_chosen_id;

  insert into bookings (
    customer_id, session_id, package_id, seats, amount, requested_session_id, auto_routed
  ) values (
    p_customer_id, v_chosen_id, p_package_id, p_seats, p_amount, p_requested_session_id, v_auto_routed
  ) returning * into v_booking;

  return v_booking;
end;
$$;

create or replace function create_payment(
  p_booking_id uuid, p_amount numeric, p_expires_at timestamptz
) returns payments
language plpgsql security definer set search_path = public as $$
declare
  v_payment payments;
begin
  insert into payments (booking_id, amount, expires_at)
  values (p_booking_id, p_amount, p_expires_at)
  returning * into v_payment;
  return v_payment;
end;
$$;

-- Payment/e-ticket page: looked up by the opaque access_token, never by the
-- sequential booking_number.
create or replace function get_booking_by_token(p_token uuid)
returns table (
  booking_id uuid, booking_number text, status text, payment_status text,
  checkin_status text, seats int, amount numeric, auto_routed boolean,
  session_date text, start_time text, end_time text,
  package_id text, package_name text,
  customer_full_name text, customer_whatsapp text,
  payment_id uuid, payment_status_live text, payment_expires_at timestamptz
)
language sql security definer set search_path = public as $$
  select b.id, b.booking_number, b.status, b.payment_status, b.checkin_status,
         b.seats, b.amount, b.auto_routed,
         s.session_date::text, s.start_time::text, s.end_time::text,
         pk.id, pk.name,
         c.full_name, c.whatsapp,
         p.id, p.status, p.expires_at
  from bookings b
  join sessions s on s.id = b.session_id
  join packages pk on pk.id = b.package_id
  join customers c on c.id = b.customer_id
  left join payments p on p.booking_id = b.id
  where b.access_token = p_token;
$$;

-- Guest self-service: "Saya Sudah Transfer" on the payment page, with an
-- optional transfer screenshot. A guest can only move their own booking
-- from PENDING to SUBMITTED (never to PAID — that stays admin-only, via
-- `admin_mark_paid`), and only once.
create or replace function submit_payment_proof(p_token uuid, p_proof_data_url text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_booking_id uuid;
begin
  select id into v_booking_id from bookings
    where access_token = p_token and payment_status = 'PENDING' and status <> 'CANCELLED';
  if v_booking_id is null then
    raise exception 'NOT_ELIGIBLE' using errcode = 'P0009';
  end if;
  update payments set status = 'SUBMITTED', proof_submitted_at = now(),
      proof_data_url = coalesce(p_proof_data_url, proof_data_url)
    where booking_id = v_booking_id;
  update bookings set payment_status = 'SUBMITTED' where id = v_booking_id;
end;
$$;

-- Door check-in: booking number + the WhatsApp number given at booking time
-- must both match — knowing only the (sequential, guessable) booking number
-- is not enough.
create or replace function check_in_booking(p_booking_number text, p_whatsapp text)
returns table (customer_full_name text, session_date text, start_time text, already_checked_in boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_booking bookings;
  v_customer customers;
  v_session sessions;
begin
  select * into v_booking from bookings where upper(booking_number) = upper(trim(p_booking_number));
  if v_booking.id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  select * into v_customer from customers where id = v_booking.customer_id;
  if regexp_replace(v_customer.whatsapp, '\D', '', 'g') <> regexp_replace(p_whatsapp, '\D', '', 'g') then
    raise exception 'CONTACT_MISMATCH' using errcode = 'P0003';
  end if;
  if v_booking.payment_status <> 'PAID' then
    raise exception 'NOT_PAID' using errcode = 'P0006';
  end if;
  select * into v_session from sessions where id = v_booking.session_id;

  update bookings set checkin_status = 'CHECKED_IN', checked_in_at = now()
    where id = v_booking.id and checkin_status <> 'CHECKED_IN';

  return query select v_customer.full_name, v_session.session_date::text, v_session.start_time::text,
    (v_booking.checkin_status = 'CHECKED_IN');
end;
$$;

-- ------------------------------------------------------------------
-- Admin operations (called only from the server-side /admin area)
-- ------------------------------------------------------------------

create or replace function admin_mark_paid(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update payments set status = 'PAID', paid_at = coalesce(paid_at, now())
    where booking_id = p_booking_id;
  update bookings set payment_status = 'PAID', status = 'CONFIRMED'
    where id = p_booking_id and status <> 'CANCELLED';
  if not found then
    raise exception 'NOT_FOUND_OR_CANCELLED' using errcode = 'P0007';
  end if;
end;
$$;

-- Cancelling gives the seats back to the session, so availability (and the
-- auto-routing walk) immediately sees them as free again.
create or replace function admin_cancel_booking(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_booking bookings;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_booking.status = 'CANCELLED' then
    return;
  end if;
  update sessions set seats_taken = seats_taken - v_booking.seats where id = v_booking.session_id;
  update bookings set status = 'CANCELLED', payment_status = 'CANCELLED' where id = p_booking_id;
  update payments set status = 'CANCELLED' where booking_id = p_booking_id and status <> 'PAID';
end;
$$;

create or replace function admin_check_in(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update bookings set checkin_status = 'CHECKED_IN', checked_in_at = coalesce(checked_in_at, now())
    where id = p_booking_id and payment_status = 'PAID' and status <> 'CANCELLED';
  if not found then
    raise exception 'NOT_ELIGIBLE' using errcode = 'P0008';
  end if;
end;
$$;

-- ------------------------------------------------------------------
-- CMS: editable website content, one row per section (see
-- src/lib/cms/schema.ts for the section keys and fields). A missing row
-- means "use the default copy shipped in code".
-- ------------------------------------------------------------------

create table if not exists cms_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Session management from the admin panel (ERP)
-- ------------------------------------------------------------------

-- create_booking's auto-routing walks sessions in (session_date, slot_index)
-- order, so slot_index must always follow start_time within a day. Called
-- after every admin add/edit; two-phase to dodge the unique constraint
-- while numbers shuffle.
create or replace function renumber_session_slots(p_date date)
returns void
language plpgsql as $$
begin
  update sessions set slot_index = slot_index + 1000 where session_date = p_date;
  update sessions s set slot_index = o.rn - 1
  from (
    select id, row_number() over (order by start_time, id) as rn
    from sessions where session_date = p_date
  ) o
  where s.id = o.id;
end;
$$;
