import Link from "next/link";
import type { BookingState } from "@/lib/booking/booking-params";
import { serviceStepHref, barberStepHref, dateStepHref } from "@/lib/booking/booking-params";

const STEP_ORDER = ["service", "barber", "date", "time", "summary"] as const;
const STEP_LABELS: Record<(typeof STEP_ORDER)[number], string> = {
  service: "Service",
  barber: "Barber",
  date: "Date",
  time: "Time",
  summary: "Confirm",
};

/**
 * Every "completed" step is a real link back to that point in the flow
 * — built from the same *StepHref functions the step components use to
 * move forward, just pointing at an earlier, already-known-valid
 * combination of params. Clicking "Service" from step 4 truncates the
 * URL back to just `?service=X`, which is exactly the transition rule
 * described in booking-params.ts: everything after the step you're
 * revisiting gets dropped, because it may no longer apply to the new
 * choice.
 */
export function BookingStepper({ state }: { state: BookingState }) {
  const currentIndex = STEP_ORDER.indexOf(state.step);

  function hrefFor(index: number): string | undefined {
    if (index === 0) return "/book";
    if (index === 1 && state.service) return serviceStepHref(state.service.slug);
    if (index === 2 && state.service && state.barberChoice) {
      return barberStepHref(state.service.slug, state.barberChoice);
    }
    if (index === 3 && state.service && state.barberChoice && state.date) {
      return dateStepHref(state.service.slug, state.barberChoice, state.date);
    }
    return undefined;
  }

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm" aria-label="Booking progress">
      {STEP_ORDER.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;
        const href = index <= currentIndex ? hrefFor(index) : undefined;
        const label = (
          <span className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                isCurrent
                  ? "bg-brass text-charcoal"
                  : isComplete
                    ? "bg-charcoal text-cream"
                    : "bg-clay text-charcoal"
              }`}
            >
              {index + 1}
            </span>
            {STEP_LABELS[step]}
          </span>
        );

        return (
          <li key={step} className="flex items-center gap-2">
            {href && !isCurrent ? (
              <Link href={href} className="min-h-11 rounded-full px-1 py-1 text-ink hover:text-brass-dark">
                {label}
              </Link>
            ) : (
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={isCurrent ? "font-medium text-charcoal" : "text-ink/70"}
              >
                {label}
              </span>
            )}
            {index < STEP_ORDER.length - 1 && <span className="text-ink/30">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
