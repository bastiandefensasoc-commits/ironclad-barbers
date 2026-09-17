/**
 * Every date in this app is a plain "YYYY-MM-DD" string, and every
 * function here treats it as a LOCAL calendar date, never as a UTC
 * instant. That distinction matters: `new Date("2026-09-20")` parses
 * the string as UTC midnight, and calling `.getDay()` on the result in
 * any timezone west of UTC (all of the Americas) can silently return
 * the PREVIOUS day — a classic bug that would misreport which day of
 * the week a date falls on, and quietly disable or enable the wrong
 * calendar cells. `parseISODate` below sidesteps this entirely by
 * building the Date from year/month/day components directly, which the
 * Date constructor always interprets in the local timezone.
 */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * The shop is physically in Austin, so "today" and "right now" have to
 * mean Austin's wall-clock time — NOT the server's own system clock.
 * That distinction is invisible in local dev (this machine's clock is
 * probably close enough to Austin's), but Vercel runs serverless
 * functions in UTC regardless of where a site's business is located.
 * Without this, the deployed site could disable the wrong day as
 * "today" or treat Austin's 9am as already "past" depending purely on
 * what time it is in UTC — a real booking-correctness bug, not a
 * cosmetic one. `Intl.DateTimeFormat` reads the wall-clock date/time as
 * it actually appears in Chicago's timezone (which observes the same
 * clock as Austin) without needing a date library.
 */
const SHOP_TIME_ZONE = "America/Chicago";

function shopNowParts(): { year: number; month: number; day: number; hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hours: Number(parts.hour),
    minutes: Number(parts.minute),
  };
}

/** Minutes since midnight, right now, in the shop's own timezone — used to filter out same-day slots that have already passed. */
export function shopCurrentMinutes(): number {
  const { hours, minutes } = shopNowParts();
  return hours * 60 + minutes;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function todayISO(): string {
  const { year, month, day } = shopNowParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 0 = Sunday … 6 = Saturday, using the same local-date logic as everything else here. */
export function dayOfWeek(iso: string): number {
  return parseISODate(iso).getDay();
}

export function isPastDate(iso: string): boolean {
  return iso < todayISO();
}

export function formatDateLabel(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDayNumber(iso: string): number {
  return parseISODate(iso).getDate();
}
