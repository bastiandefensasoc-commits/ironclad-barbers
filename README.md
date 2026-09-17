# Ironclad Barbers

A fictional two-chair barbershop in Austin, TX — portfolio piece #5 in a daily project series. This is **phase 1 of 3: frontend only**. Backend (real persistence, Server Actions) is phase 2; security hardening is phase 3. See the closing note below — this project is not done.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 (CSS-based theme, no `tailwind.config.ts`)
- Framer Motion for entrance/stagger animations, respecting `prefers-reduced-motion`
- No UI component library — every component is hand-written

## What's new here vs. the last project

A **booking flow**: service → barber → date → time → confirm. The entire flow's state lives in the `/book` URL's search params rather than React state — see the extensive comments in `lib/booking/booking-params.ts` for why (refresh-safety, shareable mid-flow links, working back/forward navigation) and what's deliberately kept out of the URL instead (name/email/phone, which stay in local component state on the summary screen).

## Structure

- `app/book/page.tsx` — the whole booking flow is one route; `parseBookingState()` derives which of five steps to render from the URL's params, re-validated on every request
- `lib/booking/availability.ts` — the availability engine: given a barber, date, and service duration, returns every slot in working hours with `available: true/false` (blocked slots are shown, not hidden, per the brief). Real time-range overlap checking, not just exact-time matching. This is the function a real backend replaces with a database query.
- `lib/booking/date-utils.ts` — deliberately timezone-aware: "today" and "current time" are computed in the shop's own timezone (`America/Chicago`) via `Intl.DateTimeFormat`, not the server's local clock. This matters in production — Vercel runs serverless functions in UTC regardless of where the business is.
- `components/booking/DateStep.tsx` — the keyboard-navigable calendar: real `<table>` markup (screen readers understand row/column semantics natively) plus a roving-tabindex pattern for arrow-key navigation.
- `lib/types.ts` + `lib/data/*.ts` — typed mock data (6 services, 4 barbers with individual weekly hours/days off, a seeded week of appointments generated relative to the real current date) behind accessor functions, so swapping in a real database later doesn't touch components.

## One known placeholder

Barber portraits and the shop interior are hand-authored SVG illustrations (`public/images/`), not real photos — no licensed photo library was available, and hotlinking guessed stock-photo URLs wasn't an acceptable substitute for a client-facing site. Every `<Image>` call is written exactly as it would be for real photography.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
