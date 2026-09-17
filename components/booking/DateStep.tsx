"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BarberChoice, Service } from "@/lib/types";
import { isDateAvailable } from "@/lib/booking/availability";
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

/**
 * The roving-tabindex position has to start on a real, reachable
 * (non-disabled) date — if it defaulted to `today` unconditionally and
 * today happened to be a barber's day off, that button would be
 * disabled, nothing else would carry tabIndex 0, and Tab would skip
 * the entire calendar with no way to reach it via keyboard at all.
 */
function findInitialFocusDate(barberChoice: BarberChoice, fromISO: string): string {
  const SEARCH_WINDOW_DAYS = 120;
  for (let offset = 0; offset < SEARCH_WINDOW_DAYS; offset++) {
    const candidate = addDays(fromISO, offset);
    if (isDateAvailable(barberChoice, candidate)) return candidate;
  }
  return fromISO;
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
  const [focusedDate, setFocusedDate] = useState<string>(
    () => selectedDate ?? findInitialFocusDate(barberChoice, today),
  );

  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const weeks = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

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

                  const available = isDateAvailable(barberChoice, iso);
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
