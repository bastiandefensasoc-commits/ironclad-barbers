import type { TimeSlot, BarberChoice, Barber } from "@/lib/types";
import { ANY_BARBER } from "@/lib/types";
import { getBarberBySlug, getAllBarbers } from "@/lib/data/barbers";
import { getConfirmedAppointmentsForBarberOnDate } from "@/lib/data/appointments";
import { dayOfWeek, isPastDate, shopCurrentMinutes, todayISO } from "@/lib/booking/date-utils";

const SLOT_STEP_MINUTES = 15;

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Used by lib/actions/booking.ts to compute an appointment's end_time from
 * its start_time + the service's duration before writing the row. */
export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Pure function over data already in hand — no query, just the same
 * open/booked/past-time math phase 1 had, now factored out so both
 * getAvailableSlots (one barber, fresh query) and the batched month-view
 * path in lib/actions/booking.ts (many days, one query up front) can
 * share it without either duplicating the logic or re-querying per day.
 */
function computeSlots(
  barber: Barber,
  date: string,
  serviceDurationMinutes: number,
  bookedRanges: { start: number; end: number }[],
): TimeSlot[] {
  if (isPastDate(date) || barber.daysOff.includes(date)) return [];

  const hours = barber.workingHours[dayOfWeek(date)];
  if (!hours) return [];

  const openMinutes = timeToMinutes(hours.start);
  const closeMinutes = timeToMinutes(hours.end);
  const isToday = date === todayISO();
  const nowMinutes = isToday ? shopCurrentMinutes() : -1;

  const slots: TimeSlot[] = [];
  for (
    let start = openMinutes;
    start + serviceDurationMinutes <= closeMinutes;
    start += SLOT_STEP_MINUTES
  ) {
    const end = start + serviceDurationMinutes;
    const isPastToday = isToday && start <= nowMinutes;
    const overlapsBooking = bookedRanges.some((range) => start < range.end && end > range.start);
    slots.push({ time: minutesToTime(start), available: !isPastToday && !overlapsBooking });
  }
  return slots;
}

/**
 * The heart of the booking flow. Returns every slot within a barber's
 * working hours for that date — including the ones that are already
 * taken — because the brief calls for unavailable slots to be visibly
 * blocked in the UI, not silently omitted from the list. A slot is
 * blocked if it falls before the barber opens or after they'd need to
 * close, if it overlaps an existing appointment's real time range (not
 * just an exact-time clash — a 50-minute combo booked at 2:00 correctly
 * blocks a 30-minute cut requested for 2:15), or if it's already in the
 * past for a same-day booking.
 *
 * This is now a real database read (via getBarberBySlug and
 * getConfirmedAppointmentsForBarberOnDate) instead of a filter over an
 * in-memory array — every component that calls it kept working
 * unchanged, just with an `await` added at the call site, which is
 * exactly the seam phase 1 was built to leave open.
 */
export async function getAvailableSlots(
  barberSlug: string,
  date: string,
  serviceDurationMinutes: number,
): Promise<TimeSlot[]> {
  const barber = await getBarberBySlug(barberSlug);
  if (!barber) return [];

  const appointments = await getConfirmedAppointmentsForBarberOnDate(barber.id, date);
  const bookedRanges = appointments.map((appt) => ({
    start: timeToMinutes(appt.startTime),
    end: timeToMinutes(appt.endTime),
  }));

  return computeSlots(barber, date, serviceDurationMinutes, bookedRanges);
}

/**
 * "Any available" barber: a time is bookable if at least one barber is
 * free for it. Merges each barber's slot list into one, taking the most
 * permissive result per time. Queries run concurrently (Promise.all)
 * rather than one after another, since the four barbers' availability
 * checks are entirely independent of each other.
 */
export async function getAvailableSlotsForAnyBarber(
  date: string,
  serviceDurationMinutes: number,
): Promise<TimeSlot[]> {
  const barbers = await getAllBarbers();
  const perBarber = await Promise.all(
    barbers.map((barber) => getAvailableSlots(barber.slug, date, serviceDurationMinutes)),
  );

  const byTime = new Map<string, boolean>();
  for (const slots of perBarber) {
    for (const slot of slots) {
      byTime.set(slot.time, (byTime.get(slot.time) ?? false) || slot.available);
    }
  }

  return [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, available]) => ({ time, available }));
}

export async function getSlotsForBarberChoice(
  barberChoice: BarberChoice,
  date: string,
  serviceDurationMinutes: number,
): Promise<TimeSlot[]> {
  return barberChoice === ANY_BARBER
    ? getAvailableSlotsForAnyBarber(date, serviceDurationMinutes)
    : getAvailableSlots(barberChoice, date, serviceDurationMinutes);
}

/** Picks the first barber (in catalog order) actually free for this exact slot — used to assign a concrete barber when the customer chose "any available". */
export async function resolveAnyBarberForSlot(
  date: string,
  time: string,
  serviceDurationMinutes: number,
): Promise<string | undefined> {
  const barbers = await getAllBarbers();
  for (const candidate of barbers) {
    const slots = await getAvailableSlots(candidate.slug, date, serviceDurationMinutes);
    if (slots.some((slot) => slot.time === time && slot.available)) return candidate.slug;
  }
  return undefined;
}

/** Pure day/hours check for one already-fetched barber — no query. Factored
 * out so the month calendar (lib/actions/booking.ts) can fetch the
 * relevant barber(s) once and check every day of the month against that
 * same data, instead of isDateAvailable's one-barber-lookup-per-day
 * re-fetching the same row up to 30 times for a single month view. */
export function isDayOpenForBarber(barber: Barber, date: string): boolean {
  if (isPastDate(date)) return false;
  if (barber.daysOff.includes(date)) return false;
  return barber.workingHours[dayOfWeek(date)] !== null;
}

/** Whether a date is even worth showing as selectable in the calendar — used to disable days off and days a chosen barber doesn't work, before the user drills into times. */
export async function isDateAvailable(barberChoice: BarberChoice, date: string): Promise<boolean> {
  if (isPastDate(date)) return false;

  const barbersToCheck =
    barberChoice === ANY_BARBER ? await getAllBarbers() : [await getBarberBySlug(barberChoice)];

  return barbersToCheck.some((barber) => (barber ? isDayOpenForBarber(barber, date) : false));
}
