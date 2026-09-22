-- Ironclad Barbers — phase 3 security hardening
-- Run once against the already-live database (Supabase SQL editor or
-- `supabase db push`). Adds no columns to existing tables — purely two new
-- tables supporting rate limiting and the appointment audit trail.

-- ============================================
-- RATE LIMITING
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
-- AUDIT TRAIL
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
