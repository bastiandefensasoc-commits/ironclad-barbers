-- Ironclad Barbers — database schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- before running seed.sql.

-- ============================================
-- EXTENSIONS
-- ============================================

-- gen_random_uuid() for primary keys and the cancellation token.
create extension if not exists pgcrypto;
-- Required for the GiST exclusion constraint below — without it, an index
-- can't combine an equality column (barber_id) with a range-overlap check
-- in a single constraint.
create extension if not exists btree_gist;

-- ============================================
-- TABLES
-- ============================================

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  description text not null,
  active boolean not null default true
);

-- working_hours is keyed by weekday as a JSON object with string keys
-- ("0".."6", Sunday first) because JSON object keys are always strings —
-- {"2": {"start":"09:00","end":"18:00"}, "0": null, ...}. A day mapped to
-- null means the barber doesn't work that day at all.
--
-- days_off is a plain array of specific dates: one-off exceptions
-- (vacation, a holiday) layered on top of the weekly working_hours
-- pattern, checked first and overriding it regardless of what
-- working_hours says for that weekday.
create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bio text not null,
  specialties text[] not null default '{}',
  image_url text,
  working_hours jsonb not null,
  days_off date[] not null default '{}'
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service_id uuid not null references public.services(id),
  barber_id uuid not null references public.barbers(id),
  -- date/start_time/end_time are timezone-naive on purpose: they store the
  -- shop's own Austin (America/Chicago) wall-clock time directly, the same
  -- way the frontend's date-utils.ts already computes it. The shop only
  -- ever has one timezone, so there's nothing for a timestamptz column to
  -- buy us here except a second, redundant place to get UTC conversion wrong.
  date date not null,
  start_time time not null,
  end_time time not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  -- A second, single-purpose identifier — separate from `id` — whose only
  -- job is granting access to this one booking via a link. See the
  -- "why a token, not the id" note in the app's /cancel/[token] page.
  confirmation_token uuid not null default gen_random_uuid() unique,
  check (end_time > start_time)
);

-- Speeds up the "every confirmed appointment for this barber on this date"
-- query that availability checking runs on every single page view of the
-- date/time steps.
create index appointments_barber_date_idx on public.appointments (barber_id, date) where status = 'confirmed';

-- THE constraint that actually prevents double-booking. An exclusion
-- constraint generalizes `unique` to "no two rows may both match" for an
-- arbitrary comparison, not just equality — here, no two *confirmed* rows
-- for the same barber may have overlapping time ranges. tsrange(...,'[)')
-- makes each appointment a half-open interval (start inclusive, end
-- exclusive), so a 9:00–9:30 booking and a 9:30–10:00 booking correctly
-- do NOT count as overlapping. This is enforced by Postgres itself as
-- part of every INSERT's commit, which is what makes it safe under
-- concurrency — two simultaneous booking attempts for the same slot will
-- have exactly one succeed, no matter how the timing lands. See the
-- app's lib/actions/booking.ts for why the app *also* re-checks
-- availability before writing, even though this constraint alone is
-- what guarantees correctness.
alter table public.appointments
  add constraint appointments_no_double_booking
  exclude using gist (
    barber_id with =,
    tsrange((date + start_time), (date + end_time), '[)') with &&
  )
  where (status = 'confirmed');

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.services enable row level security;
alter table public.barbers enable row level security;
alter table public.appointments enable row level security;

-- Once RLS is enabled on a table, Postgres denies ALL access to it by
-- default until a policy explicitly grants some. That default-deny is
-- what makes the *absence* of a select/update policy on appointments
-- below a real guarantee, not just an omission. Every policy here applies
-- to the `anon` role specifically — the role the public
-- NEXT_PUBLIC_SUPABASE_ANON_KEY maps to. The service role key used
-- server-side for availability checks and cancellation bypasses RLS
-- entirely by design, which is exactly why it must never reach the browser.

create policy "Public can view active services"
  on public.services for select
  to anon
  using (active = true);

create policy "Public can view barbers"
  on public.barbers for select
  to anon
  using (true);

-- The anon key can create a confirmed appointment (the booking flow's
-- write) but the `with check` clause is what stops it from being able to
-- insert a row already marked cancelled or completed. This matters even
-- though our own Server Action already only ever sends status:
-- 'confirmed' — the anon key is embedded in the browser bundle, so
-- anyone can read it out of the deployed JS and call Supabase's REST API
-- directly with a different payload, bypassing our Server Action
-- entirely. RLS is the actual boundary for what that key can do; our
-- application code is not.
create policy "Public can create confirmed appointments"
  on public.appointments for insert
  to anon
  with check (status = 'confirmed');

-- No select, update, or delete policy exists for appointments — for any
-- role but service_role. The anon key can create a row here but can never
-- list, read, edit, or delete any row in this table, including the one it
-- just inserted (see the code comment in lib/actions/booking.ts on why
-- the insert never chains .select()). This is what "no public reads —
-- nobody should be able to list other people's bookings" means in
-- practice: it isn't application logic choosing not to show that data,
-- it's the database refusing to return it at all.

-- ============================================
-- RATE LIMITING (phase 3)
-- ============================================

-- One row per attempt at a rate-limited action, keyed by the caller's IP.
-- See lib/security/rate-limit.ts for why this lives in Postgres rather
-- than an in-memory counter: Vercel runs Server Actions as stateless,
-- horizontally-scaled functions, so only a real row every instance can
-- read back gives a correct count across all of them.
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  action text not null,
  ip_address text not null,
  created_at timestamptz not null default now()
);

-- Supports the exact query rate-limit.ts runs on every check: "how many
-- hits for this action, from this IP, since the window started."
create index rate_limit_hits_lookup_idx
  on public.rate_limit_hits (action, ip_address, created_at);

alter table public.rate_limit_hits enable row level security;
-- No policies at all — not even a public select. This table is never
-- touched by the anon key; only server-side code using the service-role
-- client reads or writes it, so default-deny is exactly right here.

-- ============================================
-- AUDIT TRAIL (phase 3)
-- ============================================

-- One row per notable thing that happens to an appointment — created,
-- cancelled — so the shop has a real history to look at instead of just
-- the appointment's current state. See lib/data/audit.ts.
create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id),
  event_type text not null check (event_type in ('created', 'cancelled')),
  ip_address text not null,
  created_at timestamptz not null default now()
);

create index appointment_events_appointment_idx
  on public.appointment_events (appointment_id, created_at);

alter table public.appointment_events enable row level security;
-- Same reasoning as rate_limit_hits: written and read only by server-side
-- code via the service-role client, so no anon policy is defined.
