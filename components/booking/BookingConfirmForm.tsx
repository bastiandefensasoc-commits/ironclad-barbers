"use client";

import { useState, type FormEvent } from "react";

/**
 * Name, email, and phone live only here, as local component state —
 * deliberately never in the URL like the service/barber/date/time
 * selections are. Those are fine to expose in a shareable link;
 * contact details aren't, and URLs end up in browser history, server
 * logs, and referrer headers. This is also where the eventual backend
 * plugs in: the whole handleSubmit body becomes a POST to a Server
 * Action that writes a real Appointment row — the form fields and
 * validation don't need to change at all.
 */
export function BookingConfirmForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [confirmationCode] = useState(() => `IC-${Math.floor(1000 + Math.random() * 9000)}`);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 700);
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-charcoal p-6 text-cream">
        <p className="font-condensed text-2xl uppercase tracking-wide">Booked</p>
        <p className="mt-2 text-cream/80">
          Confirmation <span className="font-medium text-brass">{confirmationCode}</span>. We&rsquo;ll
          text you a reminder the day before — if you need to cancel or move it, just call the
          shop.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="h-11 w-full rounded-lg border border-clay bg-white px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11 w-full rounded-lg border border-clay bg-white px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="512-555-0100"
          className="h-11 w-full rounded-lg border border-clay bg-white px-3 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex h-12 w-full items-center justify-center rounded-full bg-brass text-sm font-semibold text-charcoal transition-colors hover:bg-brass-dark hover:text-cream disabled:opacity-60"
      >
        {status === "sending" ? "Booking…" : "Confirm booking"}
      </button>
      <p className="text-center text-xs text-ink/70">
        No charge now — you pay at the shop. Running more than 10 minutes late? Call us and we&rsquo;ll
        hold your slot if we can.
      </p>
    </form>
  );
}
