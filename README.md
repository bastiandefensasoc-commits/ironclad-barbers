# Ironclad Barbers

A fictional two-chair barbershop in Austin, TX — portfolio piece #5 in a daily project series. This is **phase 2 of 3: frontend + real backend**. Security hardening is phase 3 — see the closing note below, this project is not done.

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

## Setup

```bash
npm install
cp .env.example .env.local   # fill in real Supabase + Resend values
```

Run `supabase/schema.sql` then `supabase/seed.sql` in the Supabase SQL editor, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## One known placeholder

Barber portraits and the shop interior are hand-authored SVG illustrations (`public/images/`), not real photos — no licensed photo library was available, and hotlinking guessed stock-photo URLs wasn't an acceptable substitute for a client-facing site. Every `<Image>` call is written exactly as it would be for real photography.

## Not finished

This is phase 2 of 3. There's no rate limiting on the booking or cancellation actions, no CSRF-specific hardening beyond what Next.js Server Actions provide by default, no abuse/spam protection on the contact-adjacent forms, and no audit trail on cancellations. That's phase 3.
