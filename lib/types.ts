/**
 * Shared domain types. Pages and components import these — and only
 * these — never the mock arrays in lib/data directly. That indirection
 * is what lets lib/data/*.ts become real database queries later without
 * touching a single component.
 */

export interface Service {
  /** Database row id (uuid) — the foreign key appointments.service_id points at. */
  id: string;
  slug: string;
  name: string;
  /** Drives slot length and overlap checks in the availability engine. */
  durationMinutes: number;
  price: number;
  description: string;
  /** Not a database column — services.icon doesn't exist in the schema, since
   * it's a fixed, small set of decorative assets tied to the service slug,
   * not business data. Looked up by slug and attached client-side in
   * lib/data/services.ts. */
  icon: string;
}

/** 0 = Sunday … 6 = Saturday. `null` means the barber doesn't work that day. */
export type WorkingHours = Record<number, { start: string; end: string } | null>;

export interface Barber {
  /** Database row id (uuid) — the foreign key appointments.barber_id points at. */
  id: string;
  slug: string;
  name: string;
  bio: string;
  specialties: string[];
  photo: { src: string; alt: string };
  workingHours: WorkingHours;
  /** Specific ISO dates ("2026-09-22") off beyond the weekly pattern — vacation, holidays. */
  daysOff: string[];
}

export type AppointmentStatus = "confirmed" | "cancelled" | "completed";

/** Mirrors the appointments table directly — this is the one type in this
 * file that's a real database row shape, not a frontend-friendly reshaping
 * of one, since nothing needs it presented any other way. */
export interface Appointment {
  id: string;
  createdAt: string;
  serviceId: string;
  barberId: string;
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  /** 24h "HH:mm". */
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: AppointmentStatus;
  confirmationToken: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

/** A barber-agnostic "any available" choice, used throughout the booking flow. */
export const ANY_BARBER = "any" as const;
export type BarberChoice = string | typeof ANY_BARBER;
