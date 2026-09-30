# Holomoc Exhibition — Booking Engine

Event registration & seat booking platform for **Holomoc Exhibition**, built by
**Spero** (PT Spero Mahakarya Nusantara), per the 16 Sept 2026 meeting notes
between Spero and Holomoc.

## What this is

- One exhibition, several days, **3 one-hour sessions/day** (18.00–21.00 WIB),
  **max 13 seats per session**.
- Guests pick a date, session, F&B package, and seat count.
- **Auto-routing**: if the chosen session doesn't have enough seats left, the
  booking is automatically moved to the next session (same day, then later
  days) that does — see `create_booking` in `db/schema.sql`.
- Payment is **QRIS**. No live payment gateway is wired up yet (no merchant
  credentials were available while building this) — the payment page shows a
  QR code and the guest confirms via a WhatsApp deep link; an admin verifies
  the transfer and flips the booking to PAID by hand in Neon. Swap in a real
  PG (Xendit/Midtrans QRIS) by replacing `lib/services/payment.ts` and wiring
  its webhook to `set_payment_status` — nothing else needs to change.
- Paid bookings get an **e-ticket** with a QR code for door check-in
  (`/cek-tiket`, for staff use).

## Stack

Next.js 15 (App Router) + React 19 + Tailwind v4, **Neon** (serverless
Postgres) for the shared database. Every database call happens server-side
only (Server Components / Server Actions — see `src/lib/db/client.ts`), so
`DATABASE_URL` is a plain connection string, never a public/anon key. This is
a different setup from Spero's other booking microsite (`kelas-bermain`),
which is Supabase-backed and reachable straight from the browser via RLS +
an anon key — that model doesn't apply here.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The site renders without a database configured (marketing pages work, the
booking flow shows a "belum terhubung" notice). To make booking actually
work:

1. Create a Neon project (or use one you've already created).
2. Open its SQL Editor, paste the whole contents of `db/schema.sql`, and run
   it — or `psql "$DATABASE_URL" -f db/schema.sql`. Safe to re-run.
3. Copy the connection string (prefer the pooled one) into `.env.local` as
   `DATABASE_URL` (and into the Vercel project's environment variables for
   production).
4. Adjust the exhibition date range in `db/schema.sql`'s seed insert (and
   `src/data/schedule.ts` for the marketing page copy) once real dates are
   confirmed, then re-run the seed portion.

## Structure

- `db/schema.sql` — tables and every SQL function the app calls.
- `src/lib/db/client.ts` — the one place that opens a database connection.
- `src/lib/services/` — the only code that talks to the database.
- `src/app/(public)/pesan` — booking wizard.
- `src/app/(public)/pembayaran/[token]` — QRIS payment + WhatsApp confirmation.
- `src/app/(public)/e-tiket/[token]` — the e-ticket, shown once paid.
- `src/app/(public)/cek-tiket` — door check-in tool for staff.
