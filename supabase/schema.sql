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
