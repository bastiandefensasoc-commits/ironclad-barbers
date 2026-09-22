# Ironclad Barbers

A fictional two-chair barbershop in Austin, TX — portfolio piece #5 in a daily project series. Built in 3 phases: frontend (URL-as-state booking flow), real backend (Supabase + Server Actions), and security hardening. All three are done.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 (CSS-based theme, no `tailwind.config.ts`)
- Framer Motion for entrance/stagger animations, respecting `prefers-reduced-motion`
- Supabase (Postgres) for storage, with Row Level Security as the actual access-control boundary
- Server Actions for every write (booking submission, cancellation) — no hand-written API routes
- Zod for server-side validation
- Resend for transactional email (customer confirmation, shop notification)
- No UI component library — every component is hand-written

## What's new in phase 2

Real persistence. Phase 1's mock arrays in `lib/data/*.ts` are now Supabase queries behind the exact same function signatures, so no component had to change to make the swap — that seam was built into phase 1 on purpose. The booking flow's availability logic, timezone handling, and URL-as-state architecture are all unchanged; only what backs them is real now.

**Double-booking prevention**: a Postgres exclusion constraint (`supabase/schema.sql`) — not application code — is what actually guarantees two people can't take the same slot. See that file's comment for why, and the comment in `lib/actions/booking.ts` for why the Server Action *also* re-checks availability even though the constraint alone is what makes it safe.

**Row Level Security**: the anon key (shipped to the browser, effectively public) can read active services/barbers and insert a confirmed appointment — nothing else. Reading other customers' appointments (for availability) and updating one by cancellation token both require the service-role key, used only in server-side code that never reaches the browser. See `supabase/schema.sql` for the actual policies and what each one blocks.

## Structure

- `supabase/schema.sql`, `supabase/seed.sql` — run schema first, then seed
- `lib/supabase/server.ts` — the two Supabase client factories (public/anon vs. service-role) and why a given piece of code reaches for one over the other
- `lib/actions/booking.ts` — `submitBooking` (the real write, Zod-validated, re-checks availability, never lets an email failure undo a successful booking) and `getMonthAvailability` (a Server Action the calendar calls from the client, since a client component can't query the database directly)
- `lib/actions/cancellation.ts` — `cancelAppointment`, looked up by `confirmation_token`, not by row id — see the comment on `app/cancel/[token]/page.tsx` for why that distinction matters
- `lib/booking/availability.ts` — unchanged algorithm from phase 1, now backed by real queries
- `lib/booking/date-utils.ts` — unchanged; still timezone-aware via `Intl.DateTimeFormat` against `America/Chicago`, not the server's own clock
- `components/booking/DateStep.tsx` — the one real architecture change phase 2 forced: the calendar now fetches a month of availability via a Server Action and shows a loading state while it's in flight, instead of computing it synchronously from an in-memory array

## What's new in phase 3 (security hardening)

Everything below runs inside the Next.js app itself — no external services, no separate processes.

- **Security headers** (`proxy.ts`, `next.config.ts`): a per-request nonce'd Content-Security-Policy (needed because Next's own hydration script is inline on every page — see `proxy.ts`'s comment), plus HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a locked-down `Permissions-Policy`.
- **Rate limiting** (`lib/security/rate-limit.ts`): booking and cancellation are both capped per IP (5/15min, 10/15min) using a Postgres table, not an in-memory counter — this app runs as stateless, horizontally-scaled Vercel functions, so only a real row every instance can read back gives a correct count.
- **Bot protection** (`lib/booking/schema.ts`, `components/booking/BookingConfirmForm.tsx`): a honeypot field no real user can see or reach, plus a server-issued minimum-submission-time check.
- **Audit trail** (`lib/data/audit.ts`, `appointment_events` table): every booking creation and cancellation is logged with its IP and timestamp, separate from the appointment's current status.
- **Error handling** (`app/error.tsx`, try/catch in both Server Actions): no stack trace, DB error, or file path ever reaches the browser — server logs get the detail, the customer gets one generic message.
- **Cancellation abuse**: the token is a UUID v4 (~122 bits of entropy) — brute-forcing one isn't realistic, so no expiry was added for that reason; cancelling a confirmed appointment whose date has already passed is rejected regardless.

See `supabase/migrations/001_security_hardening.sql` for the two new tables this phase adds.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in real Supabase + Resend values
```

Run `supabase/schema.sql` then `supabase/seed.sql` in the Supabase SQL editor (a fresh setup already includes phase 3's tables), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

An already-running instance from before phase 3 only needs `supabase/migrations/001_security_hardening.sql` run once, rather than the full schema again.

## One known placeholder

Barber portraits and the shop interior are hand-authored SVG illustrations (`public/images/`), not real photos — no licensed photo library was available, and hotlinking guessed stock-photo URLs wasn't an acceptable substitute for a client-facing site. Every `<Image>` call is written exactly as it would be for real photography.
