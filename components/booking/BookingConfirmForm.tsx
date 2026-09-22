"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BarberChoice } from "@/lib/types";
import { submitBooking, type BookingActionState } from "@/lib/actions/booking";

const initialState: BookingActionState = { status: "idle" };

/**
 * Name, email, and phone live only in this form's own fields — deliberately
 * never in the URL like the service/barber/date/time selections are.
 * Those are fine to expose in a shareable link; contact details aren't,
 * and URLs end up in browser history, server logs, and referrer headers.
 * service/barber/date/time ride along as hidden inputs instead, the same
 * way EnquiryForm passes propertyId — everything the Server Action needs
 * to re-derive and re-validate the booking travels in one FormData
 * payload, not split between props and inputs.
 *
 * `useActionState(submitBooking, initialState)` wires this form directly
 * to the Server Action: `formAction` goes on the form's `action` prop,
 * `state` is whatever submitBooking last returned, and `isPending` is
 * true only while that server round trip is in flight — React tracks
 * all of this automatically.
 */
export function BookingConfirmForm({
  serviceSlug,
  barberChoice,
  date,
  time,
  formRenderedAt,
}: {
  serviceSlug: string;
  barberChoice: BarberChoice;
  date: string;
  time: string;
  /** Server timestamp (ms) from when SummaryStep rendered this form — a
   * client-generated one wouldn't prove anything, since a script skipping
   * straight to a POST could just fabricate whatever value makes the
   * elapsed-time check in submitBooking pass. This isn't watertight either
   * (nothing stops a sufficiently motivated bot from reading this value out
   * of the page and replaying it correctly), but it stops the much more
   * common case of a bot that submits without rendering the page at all. */
  formRenderedAt: number;
}) {
  const [state, formAction, isPending] = useActionState(submitBooking, initialState);

  if (state.status === "success" && state.confirmationToken) {
    return (
      <div className="rounded-2xl bg-charcoal p-6 text-cream">
        <p className="font-condensed text-2xl uppercase tracking-wide">Booked</p>
        <p className="mt-2 text-cream/80">
          We&rsquo;ve sent a confirmation to your email — if you need to cancel or move it, use the
          link in that email, or{" "}
          <Link href={`/cancel/${state.confirmationToken}`} className="text-brass underline">
            cancel it here
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="serviceSlug" value={serviceSlug} />
      <input type="hidden" name="barberChoice" value={barberChoice} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={time} />
      <input type="hidden" name="formRenderedAt" value={formRenderedAt} />

      {/* Honeypot: invisible to sighted users (off-screen, not display:none
          — see the note below on why that distinction matters), removed
          from tab order, and hidden from assistive tech, so no real visitor
          can encounter or fill it no matter how they browse. A bot that
          fills every input it finds in the DOM will fill this one anyway,
          and submitBooking treats any non-empty value here as automated. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field label="Full name" htmlFor="customerName" error={state.fieldErrors?.customerName}>
        <input
          id="customerName"
          name="customerName"
          type="text"
          required
          autoComplete="name"
          className="h-11 w-full rounded-lg border border-clay bg-white px-3 text-sm"
        />
      </Field>

      <Field label="Email" htmlFor="customerEmail" error={state.fieldErrors?.customerEmail}>
        <input
          id="customerEmail"
          name="customerEmail"
          type="email"
          required
          autoComplete="email"
          className="h-11 w-full rounded-lg border border-clay bg-white px-3 text-sm"
        />
      </Field>

      <Field label="Phone" htmlFor="customerPhone" error={state.fieldErrors?.customerPhone}>
        <input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="512-555-0100"
          className="h-11 w-full rounded-lg border border-clay bg-white px-3 text-sm"
        />
      </Field>

      {state.status === "error" && !state.fieldErrors && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-brass text-sm font-semibold text-charcoal transition-colors hover:bg-brass-dark hover:text-cream disabled:opacity-60"
      >
        {isPending ? "Booking…" : "Confirm booking"}
      </button>
      <p className="text-center text-xs text-ink/70">
        No charge now — you pay at the shop. Running more than 10 minutes late? Call us and we&rsquo;ll
        hold your slot if we can.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
