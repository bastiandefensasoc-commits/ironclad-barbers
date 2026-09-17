import Link from "next/link";
import type { BarberChoice, Service } from "@/lib/types";
import { getSlotsForBarberChoice, formatTime12h } from "@/lib/booking/availability";
import { dateStepHref, timeStepHref } from "@/lib/booking/booking-params";
import { formatDateLabel } from "@/lib/booking/date-utils";

/**
 * Server component: getSlotsForBarberChoice is a plain function over
 * mock data today, so it can run at request time on the server with no
 * client round-trip. Every slot in working hours renders — booked and
 * past ones included, just disabled and struck through — because the
 * brief specifically asks for unavailable slots to be visibly blocked,
 * not hidden. Hiding them would make the shop look less busy than it
 * is and would make "why can't I pick 2pm" a support question instead
 * of something the page already answers.
 */
export function TimeStep({
  service,
  barberChoice,
  date,
}: {
  service: Service;
  barberChoice: BarberChoice;
  date: string;
}) {
  const slots = getSlotsForBarberChoice(barberChoice, date, service.durationMinutes);
  const hasAnySlots = slots.length > 0;
  const hasOpenSlots = slots.some((slot) => slot.available);

  return (
    <div>
      <Link
        href={dateStepHref(service.slug, barberChoice, date)}
        className="text-sm text-ink/70 hover:text-brass-dark"
      >
        ← Change date
      </Link>
      <h1 className="mt-2 font-condensed text-3xl uppercase tracking-wide text-charcoal sm:text-4xl">
        Pick a time
      </h1>
      <p className="mt-2 text-ink/70">{formatDateLabel(date)}</p>

      {!hasAnySlots && (
        <p className="mt-8 max-w-md rounded-2xl bg-sand p-4 text-sm text-ink/70">
          No barber is working this day. Go back and choose a different date.
        </p>
      )}

      {hasAnySlots && !hasOpenSlots && (
        <p className="mt-8 max-w-md rounded-2xl bg-sand p-4 text-sm text-ink/70">
          Every slot on this day is taken. Try the next day, or check back — cancellations happen.
        </p>
      )}

      {hasAnySlots && (
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {slots.map((slot) =>
            slot.available ? (
              <Link
                key={slot.time}
                href={timeStepHref(service.slug, barberChoice, date, slot.time)}
                className="flex min-h-11 items-center justify-center rounded-full border border-clay text-sm text-ink transition-colors hover:border-brass hover:bg-white"
              >
                {formatTime12h(slot.time)}
              </Link>
            ) : (
              <span
                key={slot.time}
                aria-label={`${formatTime12h(slot.time)}, unavailable`}
                className="flex min-h-11 items-center justify-center rounded-full bg-sand text-sm text-ink/30 line-through"
              >
                {formatTime12h(slot.time)}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
