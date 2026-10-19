# Hololabs — Reservation & Booking Engine

Reservation and seat-booking platform for **Hololabs** (a creative technology
exhibition/experience lab), built by **Spero** (PT Spero Mahakarya
Nusantara). The public site's homepage and navigation are styled after
meatguysteakhouse.com, per the client's request; the booking engine
underneath is Spero's own.

## What this is

- One Experience Journey per show, **1,5 jam**, two shows a day
  (18.00–21.00 WIB), **max 13 seats per show**. Each show is a 7-stage
  journey (booking seat → video mapping → interactive DJ performance → AI
  avatar chat → smart home demo → custom 3D printing → pulang).
- Guests pick a date (a real calendar, not a dropdown), show, F&B package,
  and seat count — then a customer-info + terms screen — all on one
  dedicated reservation screen at `/pesan`.
- **Auto-routing**: if the chosen session doesn't have enough seats left,
  the booking is automatically moved to the next session (same day, then
  later days) that does — see `create_booking` in `db/schema.sql`.
- Payment is **manual bank transfer** (dummy BCA/Mandiri accounts for now).
  The guest confirms on the site itself ("Saya Sudah Transfer", with an
  optional screenshot upload) — never a hand-off to WhatsApp or any other
  channel — which flips the booking to SUBMITTED ("menunggu konfirmasi").
  An admin checks the transfer and confirms it from the admin panel, which
  flips it to PAID.
- Paid bookings get an **e-ticket** with a QR code for door check-in
  (`/cek-tiket` for guests to check status, `/admin/check-in` for staff).
- A full admin/CMS panel at `/admin` — bookings, sessions, packages,
  customers, reports, CSV export, and a content editor for every section
  of the public site (Hero, About Us, Founder & Tim, Ambiance, Collection,
  Rundown, Our Story, Kontak & footer).

## Stack

Next.js 15 (App Router) + React 19 + Tailwind v4, plain **Postgres** for the
shared database — no managed-provider SDK, just the standard wire protocol
via `pg` (see `src/lib/db/client.ts`). Works against any Postgres server:
a local one for development, a VPS you run yourself, or a managed instance
from whatever host you deploy to. Every database call happens server-side
only (Server Components / Server Actions), so `DATABASE_URL` is a plain
connection string, never a public/anon key. This is a different setup from
Spero's other booking microsite (`kelas-bermain`), which is Supabase-backed
and reachable straight from the browser via RLS + an anon key — that model
doesn't apply here.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The site renders without a database configured (marketing pages work, the
booking flow shows a "belum terhubung" notice). To make booking actually
work:

1. Have a Postgres server reachable from where you're running this (local
   Postgres for development; your production server for deployment).
2. Run `psql "$DATABASE_URL" -f db/schema.sql` against it — or paste the
   whole file into whatever SQL console your host provides. Safe to re-run.
3. Put that same connection string into `.env.local` as `DATABASE_URL` (and
   into your hosting provider's environment variables for production).
4. Also set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (see
   `.env.example`) — required for `/admin`.
5. Adjust the exhibition date range in `db/schema.sql`'s seed insert once
   real dates are confirmed, then re-run the seed portion (or manage
   sessions from `/admin/sessions` instead).

## Structure

- `db/schema.sql` — tables and every SQL function the app calls.
- `src/lib/db/client.ts` — the one place that opens a database connection.
- `src/lib/services/` — the only code that talks to the database.
- `src/lib/cms/` — the editable-content schema and merge logic for `/admin/konten`.
- `src/app/pesan` — the full-screen reservation flow (own layout, no site header/footer).
- `src/app/(public)/pembayaran/[token]` — bank-transfer payment + proof upload.
- `src/app/(public)/e-tiket/[token]` — the e-ticket, shown once paid.
- `src/app/(public)/cek-tiket` — booking-status lookup for guests.
- `src/app/(public)/ambiance`, `/collection`, `/rundown`, `/our-story` — pages reached from the header's hamburger menu.
- `src/app/admin` — the admin/CMS panel (see `src/app/admin/layout.tsx` for the full nav).
