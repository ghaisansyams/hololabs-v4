-- HOLOLABS Immersive Website — skema basis data
--
-- Mengikuti Lampiran B PRD. Dijalankan sekali di Neon (atau Postgres mana
-- pun); aman dijalankan ulang, tidak ada perintah yang menghapus tabel.
--
--   psql "$DATABASE_URL" -f supabase/schema.sql

-- ------------------------------------------------------------------
-- 1. Pengguna admin
-- ------------------------------------------------------------------

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  password_hash text not null,
  role text not null default 'CONTENT_ADMIN'
    check (role in ('CONTENT_ADMIN', 'SUPER_ADMIN')),
  is_active boolean not null default true,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 2. CMS — satu baris per scene, draft dan published terpisah
-- ------------------------------------------------------------------

create table if not exists cms_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  section_type text not null default '',
  label text not null default '',
  draft jsonb not null default '{}'::jsonb,
  published jsonb,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  archived boolean not null default false,
  -- Tata letak, hanya dari preset. Tidak ada nilai piksel yang diketik admin.
  presentation jsonb not null default '{}'::jsonb,
  -- Parameter 3D per scene. Rentangnya dijaga aplikasi, bukan diketik bebas.
  scene_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references users (id),
  published_at timestamptz,
  unique (page_key, section_key)
);

create index if not exists cms_sections_order_idx
  on cms_sections (page_key, sort_order) where not archived;

-- Isi berulang: solutions, portfolio, tahap journey, karakter brand, dll.
create table if not exists cms_collections (
  id uuid primary key default gen_random_uuid(),
  collection_key text not null,
  item_key text not null,
  draft jsonb not null default '{}'::jsonb,
  published jsonb,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  archived boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references users (id),
  published_at timestamptz,
  unique (collection_key, item_key)
);

create index if not exists cms_collections_key_idx
  on cms_collections (collection_key, sort_order);

-- Satu snapshot per publish, supaya salah edit selalu bisa dikembalikan.
create table if not exists cms_versions (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('page', 'collection')),
  scope_key text not null,
  snapshot jsonb not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references users (id)
);

create index if not exists cms_versions_scope_idx
  on cms_versions (scope, scope_key, created_at desc);

create table if not exists navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null unique,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  open_in_new_tab boolean not null default false
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  type text not null default 'image',
  alt text not null default '',
  width int,
  height int,
  bytes int,
  uploaded_by uuid references users (id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 3. Lead dan reservasi
-- ------------------------------------------------------------------

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null default '',
  role text not null default '',
  email text not null,
  whatsapp text not null,
  services text[] not null default '{}',
  event_date date,
  budget text not null default '',
  message text not null,
  status text not null default 'NEW'
    check (status in ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST')),
  internal_note text not null default '',
  source_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  whatsapp text not null,
  email text not null default '',
  people int not null check (people between 1 and 30),
  visitor_type text not null,
  preferred_date date not null,
  note text not null default '',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED')),
  source_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_date_idx on bookings (preferred_date);
create index if not exists bookings_status_idx on bookings (status);

-- Satu nomor WhatsApp dibatasi tiga booking aktif (PRD bagian 8). Ditegakkan
-- di basis data, bukan hanya di aplikasi, supaya dua permintaan bersamaan
-- tidak bisa menembusnya.
create or replace function enforce_active_booking_limit()
returns trigger
language plpgsql
as $$
declare
  active_count int;
begin
  if new.status in ('PENDING', 'CONFIRMED') then
    select count(*) into active_count
    from bookings
    where whatsapp = new.whatsapp
      and status in ('PENDING', 'CONFIRMED')
      and id <> new.id;

    if active_count >= 3 then
      raise exception 'BOOKING_LIMIT' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_limit on bookings;
create trigger bookings_limit
  before insert or update on bookings
  for each row execute function enforce_active_booking_limit();

-- ------------------------------------------------------------------
-- 3b. Show booking: jadwal show + paket F&B
--
-- Disamakan dengan booking engine hololabs-id (repo ghaisansyams/hololabs,
-- db/schema.sql): 5 hari pameran, 2 show per hari @1,5 jam, maks. 13 kursi
-- per show, tiga paket F&B dengan harga per kursi yang sama. Kalau harga
-- atau tanggal berubah, ubah di kedua repo — dan di src/content/site.ts
-- (showSchedule/showPackages) yang dipakai halaman publik saat render.
--
-- Kolom lama di bookings (people, visitor_type, preferred_date) tetap diisi
-- supaya dashboard admin yang sudah ada tidak perlu tahu skema baru ini.
-- ------------------------------------------------------------------

create table if not exists packages (
  id text primary key,
  name text not null,
  description text not null default '',
  includes text[] not null default '{}',
  price numeric not null check (price >= 0),
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
on conflict (id) do update set
  name = excluded.name, description = excluded.description,
  includes = excluded.includes, price = excluded.price, sort_order = excluded.sort_order;

create table if not exists show_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  slot_index int not null,
  start_time time not null,
  end_time time not null,
  capacity int not null default 13 check (capacity > 0),
  unique (session_date, slot_index)
);

insert into show_sessions (session_date, slot_index, start_time, end_time)
select d::date, t.slot, t.start_time, t.end_time
from generate_series('2026-10-15'::date, '2026-10-19'::date, interval '1 day') as d
cross join (
  values (0, '18:00'::time, '19:30'::time),
         (1, '19:30'::time, '21:00'::time)
) as t(slot, start_time, end_time)
on conflict (session_date, slot_index) do nothing;

alter table bookings add column if not exists session_id uuid references show_sessions (id);
alter table bookings add column if not exists requested_session_id uuid references show_sessions (id);
alter table bookings add column if not exists package_id text references packages (id);
alter table bookings add column if not exists seats int check (seats between 1 and 13);
alter table bookings add column if not exists amount numeric not null default 0;
alter table bookings add column if not exists auto_routed boolean not null default false;

create index if not exists bookings_session_idx on bookings (session_id);

-- Kursi terpakai dihitung dari booking aktif, bukan disimpan sebagai
-- penghitung: membatalkan booking dari dashboard admin (yang hanya
-- mengubah status) otomatis mengembalikan kursinya tanpa trigger tambahan.
-- Tanggal dan jam di-cast ke teks supaya klien mana pun membacanya sama.
create or replace view show_availability as
select
  s.id,
  s.session_date::text as session_date,
  s.slot_index,
  s.start_time::text as start_time,
  s.end_time::text as end_time,
  s.capacity,
  coalesce(sum(b.seats) filter (where b.status in ('PENDING', 'CONFIRMED', 'ATTENDED')), 0)::int as seats_taken
from show_sessions s
left join bookings b on b.session_id = s.id
group by s.id;

-- Booking + aturan auto-routing: kalau show yang diminta tidak punya cukup
-- kursi, booking dipindah ke show berikutnya (hari yang sama dulu, lalu hari
-- sesudahnya) yang masih cukup. Tiap kandidat dikunci FOR UPDATE sebelum
-- kursinya dihitung, jadi dua pemesan yang berebut kursi terakhir di show
-- yang sama diproses bergantian, tidak bisa sama-sama lolos. Harga dihitung
-- di sini dari tabel packages — angka dari browser tidak pernah dipercaya.
create or replace function create_show_booking(
  p_code text, p_name text, p_whatsapp text, p_email text,
  p_requested_session uuid, p_package text, p_seats int, p_note text, p_ip text
) returns table (
  id uuid, code text, session_date text, start_time text, end_time text,
  package_name text, seats int, amount numeric, auto_routed boolean
)
language plpgsql
as $$
#variable_conflict use_column
declare
  v_requested show_sessions;
  v_candidate uuid;
  v_locked show_sessions;
  v_taken int;
  v_chosen show_sessions;
  v_package packages;
  v_booking bookings;
begin
  if p_seats is null or p_seats < 1 or p_seats > 13 then
    raise exception 'INVALID_SEATS' using errcode = 'P0001';
  end if;

  select * into v_package from packages where packages.id = p_package and packages.active;
  if v_package.id is null then
    raise exception 'PACKAGE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_requested from show_sessions where show_sessions.id = p_requested_session;
  if v_requested.id is null then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;

  for v_candidate in
    select s.id from show_sessions s
    where (s.session_date, s.slot_index) >= (v_requested.session_date, v_requested.slot_index)
    order by s.session_date, s.slot_index
  loop
    select * into v_locked from show_sessions where show_sessions.id = v_candidate for update;
    select coalesce(sum(b.seats), 0) into v_taken
      from bookings b
      where b.session_id = v_candidate and b.status in ('PENDING', 'CONFIRMED', 'ATTENDED');
    if v_locked.capacity - v_taken >= p_seats then
      v_chosen := v_locked;
      exit;
    end if;
  end loop;

  if v_chosen.id is null then
    raise exception 'NO_AVAILABILITY' using errcode = 'P0001';
  end if;

  insert into bookings (
    code, name, whatsapp, email, people, visitor_type, preferred_date, note, source_ip,
    session_id, requested_session_id, package_id, seats, amount, auto_routed
  ) values (
    p_code, p_name, p_whatsapp, coalesce(p_email, ''), p_seats,
    case when p_seats <= 3 then 'individual' when p_seats <= 6 then 'family' else 'community' end,
    v_chosen.session_date, coalesce(p_note, ''), p_ip,
    v_chosen.id, v_requested.id, v_package.id, p_seats, v_package.price * p_seats,
    v_chosen.id <> v_requested.id
  )
  returning * into v_booking;

  return query select
    v_booking.id, v_booking.code, v_chosen.session_date::text,
    v_chosen.start_time::text, v_chosen.end_time::text,
    v_package.name, v_booking.seats, v_booking.amount, v_booking.auto_routed;
end;
$$;

-- ------------------------------------------------------------------
-- 4. Audit trail — hanya-tambah (PRD bagian 9)
-- ------------------------------------------------------------------

create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid references users (id),
  action text not null,
  entity text not null,
  entity_id text not null default '',
  old_value jsonb,
  new_value jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on audit_logs (created_at desc);

-- ------------------------------------------------------------------
-- 5. Seed — isi yang sekarang sudah tayang
--
-- Publish dari admin karena itu dimulai dari apa yang persis sudah live, dan
-- tidak ada yang perlu mengetik ulang. ON CONFLICT DO NOTHING supaya
-- menjalankan ulang berkas ini tidak pernah menimpa hasil editan.
-- ------------------------------------------------------------------

insert into cms_sections (page_key, section_key, section_type, label, sort_order, draft, published, published_at)
values
  ('home', 'hero', 'hero', 'Hero', 10, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'essence', 'story', 'Brand Essence', 20, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'integration', 'story', 'Integration', 30, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'colors', 'story', 'Color Journey', 40, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'dna', 'cards', 'Our DNA', 50, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'solutions', 'accordion', 'Solutions', 60, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'ecosystem', 'stack', 'Ecosystem', 70, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'journey', 'journey', 'Experience Journey', 80, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'process', 'process', 'How We Work', 90, '{}'::jsonb, '{}'::jsonb, now()),
  ('home', 'contact', 'contact', 'Contact', 100, '{}'::jsonb, '{}'::jsonb, now())
on conflict (page_key, section_key) do nothing;
