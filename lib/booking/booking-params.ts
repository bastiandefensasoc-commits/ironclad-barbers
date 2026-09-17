import type { Service, Barber, BarberChoice } from "@/lib/types";
import { ANY_BARBER } from "@/lib/types";
import { getServiceBySlug } from "@/lib/data/services";
import { getBarberBySlug } from "@/lib/data/barbers";
import { getSlotsForBarberChoice, isDateAvailable } from "@/lib/booking/availability";

export type BookingStep = "service" | "barber" | "date" | "time" | "summary";

export interface BookingState {
  step: BookingStep;
  service?: Service;
  barberChoice?: BarberChoice;
  barber?: Barber;
  date?: string;
  time?: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The entire booking "state machine" lives here. There's no
 * useReducer with explicit transition cases — the URL search params
 * ARE the state, and this function just validates them in order,
 * stopping at the first one that's missing or no longer valid. That
 * "stop at the first invalid param" rule is what makes it a real state
 * machine and not just a formatter: it's what decides which step
 * renders, and it's why a hand-edited or stale URL degrades gracefully
 * to the earliest step that's still legitimate, instead of crashing or
 * skipping ahead on bad data. Called once, server-side, on every
 * request to /book — the step you see is always freshly re-validated
 * against the current mock data, never trusted blindly from the URL.
 */
export function parseBookingState(searchParams: SearchParams): BookingState {
  const serviceSlug = param(searchParams, "service");
  const service = serviceSlug ? getServiceBySlug(serviceSlug) : undefined;
  if (!service) return { step: "service" };

  const barberParam = param(searchParams, "barber");
  const barberChoice: BarberChoice | undefined =
    barberParam === ANY_BARBER ? ANY_BARBER : barberParam && getBarberBySlug(barberParam) ? barberParam : undefined;
  if (!barberChoice) return { step: "barber", service };
  const barber = barberChoice === ANY_BARBER ? undefined : getBarberBySlug(barberChoice);

  const date = param(searchParams, "date");
  const dateValid = !!date && ISO_DATE.test(date) && isDateAvailable(barberChoice, date);
  if (!dateValid) return { step: "date", service, barberChoice, barber };

  const time = param(searchParams, "time");
  const slots = getSlotsForBarberChoice(barberChoice, date!, service.durationMinutes);
  const timeValid = !!time && slots.some((slot) => slot.time === time && slot.available);
  if (!timeValid) return { step: "time", service, barberChoice, barber, date };

  return { step: "summary", service, barberChoice, barber, date, time };
}

export function serviceStepHref(serviceSlug: string): string {
  return `/book?service=${serviceSlug}`;
}

export function barberStepHref(serviceSlug: string, barberChoice: BarberChoice): string {
  return `/book?service=${serviceSlug}&barber=${barberChoice}`;
}

export function dateStepHref(serviceSlug: string, barberChoice: BarberChoice, date: string): string {
  return `/book?service=${serviceSlug}&barber=${barberChoice}&date=${date}`;
}

export function timeStepHref(
  serviceSlug: string,
  barberChoice: BarberChoice,
  date: string,
  time: string,
): string {
  return `/book?service=${serviceSlug}&barber=${barberChoice}&date=${date}&time=${time}`;
}
