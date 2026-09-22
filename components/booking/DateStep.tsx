"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BarberChoice, Service } from "@/lib/types";
import { getMonthAvailability } from "@/lib/actions/booking";
import { dateStepHref, barberStepHref } from "@/lib/booking/booking-params";
import { addDays, dayOfWeek, formatDateLabel, todayISO } from "@/lib/booking/date-utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_BOOKABLE_AHEAD = 3; // how far into the future the calendar allows browsing

interface MonthKey {
  year: number;
  month: number; // 0-indexed
}

function monthKeyFromISO(iso: string): MonthKey {
  const [year, month] = iso.split("-").map(Number);
  return { year, month: month - 1 };
}

function addMonths({ year, month }: MonthKey, delta: number): MonthKey {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

function sameMonth(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Builds a 6-row×7-col grid of ISO date strings, null for padding cells outside the month. */
function buildMonthGrid({ year, month }: MonthKey): (string | null)[][] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const cells: (string | null)[] = Array(startWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push(iso);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * A real HTML <table> rather than hand-rolled ARIA grid roles — screen
 * readers already understand row/column relationships in table markup
 * natively, which is a well-trodden accessible pattern for calendars
 * and less code than reimplementing grid semantics by hand.
 *
 * Keyboard navigation uses "roving tabindex": only one day button is
 * ever in the natural Tab order (tabIndex 0) at a time — every other
 * enabled day is tabIndex -1, reachable only via arrow keys, which is
 * what lets Tab move past the whole calendar in one stop instead of
 * stopping on all ~30 days. Arrow keys move the roving position and
 * imperatively focus the target button via a ref map, since moving
 * focus is a DOM operation React's declarative model doesn't do for us.
 *
 * The one piece of real complexity phase 2 added: this component can no
 * longer know synchronously which days are open. It fetches one whole
 * month's availability from getMonthAvailability (a Server Action) via
 * useEffect whenever the visible month changes, and disables every day
 * until that data has actually arrived — see the isLoading handling
 * below for why that matters for keyboard focus specifically, not just
 * what's rendered.
 */
export function DateStep({
  service,
  barberChoice,
  selectedDate,
}: {
  service: Service;
  barberChoice: BarberChoice;
  selectedDate?: string;
}) {
  const router = useRouter();
  const today = todayISO();
  const currentMonthKey = monthKeyFromISO(today);
  const maxMonthKey = addMonths(currentMonthKey, MONTHS_BOOKABLE_AHEAD);

  const [visibleMonth, setVisibleMonth] = useState<MonthKey>(
    selectedDate ? monthKeyFromISO(selectedDate) : currentMonthKey,
  );
  const [focusedDate, setFocusedDate] = useState<string>(selectedDate ?? today);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const weeks = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  // Refetches whenever the visible month (or the barber choice, though
  // that doesn't change once this step is reached) changes. `cancelled`
  // guards against a slow response for a month the user has already
  // navigated away from overwriting the data for the one they're
  // looking at now.
  useEffect(() => {
    let cancelled = false;
    // Setting this synchronously, before the async call below, is what
    // makes the loading state actually show *while* the fetch is in
    // flight rather than only after — moving it into the .then() would
    // defeat the point of it. This is the React docs' own recommended
    // shape for an effect that fetches data (react.dev/reference/react/useEffect#fetching-data-with-effects).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    getMonthAvailability(barberChoice, visibleMonth.year, visibleMonth.month).then((results) => {
      if (cancelled) return;
      const map: Record<string, boolean> = {};
      for (const { date, available } of results) map[date] = available;
      setAvailability(map);
      setIsLoading(false);

      // If the roving-tabindex target isn't actually open (most commonly:
      // it defaulted to `today` and today turned out to be a day off) and
      // we now have real data for a day that is, retarget it — without
      // this, the initial Tab into the calendar could land on a disabled
      // button with nothing else in the tab order to reach.
      const stillFocusable = map[focusedDate];
      if (!stillFocusable) {
        const firstOpenInMonth = Object.entries(map).find(([, open]) => open)?.[0];
        if (firstOpenInMonth) setFocusedDate(firstOpenInMonth);
      }

      // Re-claim DOM focus after a month-boundary navigation: the button
      // the user just arrow-keyed onto may have rendered disabled (data
      // not loaded yet) and lost focus to the page body when its month
      // was still showing stale state. Once real data confirms it's
      // open, pull focus back onto it.
      requestAnimationFrame(() => {
        if (map[focusedDate]) buttonRefs.current.get(focusedDate)?.focus();
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focusedDate is read, not a dependency: including it would refetch on every focus change instead of only on month navigation.
  }, [barberChoice, visibleMonth.year, visibleMonth.month]);

  function focusDate(iso: string) {
    setFocusedDate(iso);
    // The target date may fall in an adjacent month if the user arrows
    // past the edge of the visible grid — bring it into view first.
    const targetMonth = monthKeyFromISO(iso);
    if (!sameMonth(targetMonth, visibleMonth)) setVisibleMonth(targetMonth);
    requestAnimationFrame(() => buttonRefs.current.get(iso)?.focus());
  }

  function handleKeyDown(event: React.KeyboardEvent, iso: string) {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in deltas) {
      event.preventDefault();
      focusDate(addDays(iso, deltas[event.key]));
    } else if (event.key === "Home") {
      event.preventDefault();
      focusDate(addDays(iso, -(dayOfWeek(iso))));
    } else if (event.key === "End") {
      event.preventDefault();
      focusDate(addDays(iso, 6 - dayOfWeek(iso)));
    }
  }

  const canGoPrev = !sameMonth(visibleMonth, currentMonthKey);
  const canGoNext = !sameMonth(visibleMonth, maxMonthKey);
  const monthLabel = new Date(visibleMonth.year, visibleMonth.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <Link
        href={barberStepHref(service.slug, barberChoice)}
        className="text-sm text-ink/70 hover:text-brass-dark"
      >
        ← Change barber
      </Link>
      <h1 className="mt-2 font-condensed text-3xl uppercase tracking-wide text-charcoal sm:text-4xl">
        Pick a date
      </h1>
      <p className="mt-2 text-ink/70">Grayed-out days are fully booked or a barber&rsquo;s day off.</p>

      <div className="mt-8 max-w-md rounded-2xl border border-clay/60 bg-white/60 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
            disabled={!canGoPrev}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal hover:bg-sand disabled:pointer-events-none disabled:opacity-30"
          >
            ‹
          </button>
          <p className="font-condensed text-xl uppercase tracking-wide text-charcoal" aria-live="polite">
            {monthLabel}
            {isLoading && <span className="sr-only"> — loading availability</span>}
          </p>
          <button
            type="button"
            onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
            disabled={!canGoNext}
            aria-label="Next month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal hover:bg-sand disabled:pointer-events-none disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <table className="mt-4 w-full border-collapse">
          <caption className="sr-only">{monthLabel}</caption>
          <thead>
            <tr>
              {WEEKDAY_LABELS.map((label) => (
                <th key={label} scope="col" className="pb-2 text-xs font-medium text-ink/70">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((iso, dayIndex) => {
                  if (!iso) return <td key={dayIndex} />;

                  const available = !isLoading && (availability[iso] ?? false);
                  const isSelected = iso === selectedDate;
                  const isToday = iso === today;
                  const isRoving = iso === focusedDate;

                  return (
                    <td key={iso} className="p-1 text-center">
                      <button
                        type="button"
                        disabled={!available}
                        tabIndex={isRoving ? 0 : -1}
                        ref={(el) => {
                          if (el) buttonRefs.current.set(iso, el);
                          else buttonRefs.current.delete(iso);
                        }}
                        onKeyDown={(event) => handleKeyDown(event, iso)}
                        onFocus={() => setFocusedDate(iso)}
                        onClick={() => router.push(dateStepHref(service.slug, barberChoice, iso))}
                        aria-label={`${formatDateLabel(iso)}${!available ? ", unavailable" : ""}`}
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm transition-colors ${
                          !available
                            ? "cursor-not-allowed text-ink/25 line-through"
                            : isSelected
                              ? "bg-brass font-semibold text-charcoal"
                              : isToday
                                ? "border border-brass text-charcoal hover:bg-sand"
                                : "text-ink hover:bg-sand"
                        }`}
                      >
                        {Number(iso.slice(-2))}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDate && (
        <p className="mt-4 text-sm text-ink/70">Selected: {formatDateLabel(selectedDate)}</p>
      )}
    </div>
  );
}
