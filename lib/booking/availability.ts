import type { TimeSlot, BarberChoice } from "@/lib/types";
import { ANY_BARBER } from "@/lib/types";
import { getBarberBySlug, getAllBarbers } from "@/lib/data/barbers";
import { getAppointmentsForBarberOnDate } from "@/lib/data/appointments";
import { getServiceBySlug } from "@/lib/data/services";
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

export function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
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
 * This function, plus getAvailableSlotsForAnyBarber below it, are the
 * two functions a real backend replaces with a database query — every
 * component that calls them keeps working unchanged either way.
 */
export function getAvailableSlots(
  barberSlug: string,
  date: string,
  serviceDurationMinutes: number,
): TimeSlot[] {
  const barber = getBarberBySlug(barberSlug);
  if (!barber || isPastDate(date)) return [];
  if (barber.daysOff.includes(date)) return [];

  const hours = barber.workingHours[dayOfWeek(date)];
  if (!hours) return [];

  const bookedRanges = getAppointmentsForBarberOnDate(barberSlug, date).map((appt) => {
    const duration = getServiceBySlug(appt.serviceSlug)?.durationMinutes ?? 30;
    const start = timeToMinutes(appt.time);
    return { start, end: start + duration };
  });

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
 * "Any available" barber: a time is bookable if at least one barber is
 * free for it. Merges each barber's slot list into one, taking the most
 * permissive result per time.
 */
export function getAvailableSlotsForAnyBarber(date: string, serviceDurationMinutes: number): TimeSlot[] {
  const perBarber = getAllBarbers().map((barber) =>
    getAvailableSlots(barber.slug, date, serviceDurationMinutes),
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

export function getSlotsForBarberChoice(
  barberChoice: BarberChoice,
  date: string,
  serviceDurationMinutes: number,
): TimeSlot[] {
  return barberChoice === ANY_BARBER
    ? getAvailableSlotsForAnyBarber(date, serviceDurationMinutes)
    : getAvailableSlots(barberChoice, date, serviceDurationMinutes);
}

/** Picks the first barber (in catalog order) actually free for this exact slot — used to assign a concrete barber when the customer chose "any available". */
export function resolveAnyBarberForSlot(
  date: string,
  time: string,
  serviceDurationMinutes: number,
): string | undefined {
  const barber = getAllBarbers().find((candidate) =>
    getAvailableSlots(candidate.slug, date, serviceDurationMinutes).some(
      (slot) => slot.time === time && slot.available,
    ),
  );
  return barber?.slug;
}

/** Whether a date is even worth showing as selectable in the calendar — used to disable days off and days a chosen barber doesn't work, before the user drills into times. */
export function isDateAvailable(barberChoice: BarberChoice, date: string): boolean {
  if (isPastDate(date)) return false;

  const barbersToCheck = barberChoice === ANY_BARBER ? getAllBarbers() : [getBarberBySlug(barberChoice)];

  return barbersToCheck.some((barber) => {
    if (!barber) return false;
    if (barber.daysOff.includes(date)) return false;
    return barber.workingHours[dayOfWeek(date)] !== null;
  });
}
