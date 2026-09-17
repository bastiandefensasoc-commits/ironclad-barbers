/**
 * Shared domain types. Pages and components import these — and only
 * these — never the mock arrays in lib/data directly. That indirection
 * is what lets lib/data/*.ts become real database queries later without
 * touching a single component.
 */

export interface Service {
  slug: string;
  name: string;
  /** Drives slot length and overlap checks in the availability engine. */
  durationMinutes: number;
  price: number;
  description: string;
  icon: string;
}

/** 0 = Sunday … 6 = Saturday. `null` means the barber doesn't work that day. */
export type WorkingHours = Record<number, { start: string; end: string } | null>;

export interface Barber {
  slug: string;
  name: string;
  bio: string;
  specialties: string[];
  photo: { src: string; alt: string };
  workingHours: WorkingHours;
  /** Specific ISO dates ("2026-09-22") off beyond the weekly pattern — vacation, holidays. */
  daysOff: string[];
}

export interface Appointment {
  id: string;
  serviceSlug: string;
  barberSlug: string;
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  /** 24h "HH:mm". */
  time: string;
  customerName: string;
  email: string;
  phone: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

/** A barber-agnostic "any available" choice, used throughout the booking flow. */
export const ANY_BARBER = "any" as const;
export type BarberChoice = string | typeof ANY_BARBER;
