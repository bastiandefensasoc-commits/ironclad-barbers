import { z } from "zod";
import { ANY_BARBER } from "@/lib/types";

const UUID = z.string().uuid();
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const TIME_24H = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time");

/**
 * The single source of truth for what a valid booking submission looks
 * like — used server-side in lib/actions/booking.ts, which is the real
 * security boundary (see the comment there on why). serviceSlug and
 * barberChoice arrive as slugs from the booking flow's URL, the same
 * values the rest of the app already works with; they get resolved to
 * database ids inside the Server Action, after this schema confirms
 * they're at least well-formed.
 */
export const bookingSchema = z.object({
  serviceSlug: z.string().min(1, "Choose a service"),
  barberChoice: z.union([z.literal(ANY_BARBER), z.string().min(1)]),
  date: ISO_DATE,
  time: TIME_24H,
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "That name is too long"),
  customerEmail: z.string().trim().email("Enter a valid email"),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "That phone number is too long")
    .regex(/^[\d\s()+-]+$/, "Use only digits and phone punctuation"),
});

export type BookingInput = z.infer<typeof bookingSchema>;

/**
 * Bot-defense fields, deliberately kept OUT of bookingSchema above rather
 * than added as extra properties on it. If the honeypot were a normal
 * Zod field, a failed check would surface through the same
 * `fieldErrors` object the real form fields use — visibly naming
 * "honeypot" in the response tells an attacker the mechanism exists and
 * what it's called, which defeats the point. These are parsed and
 * checked separately in the Server Action, and a failure there returns
 * the exact same generic message a rate-limit rejection would, so the
 * two are indistinguishable from the outside.
 */
export const botDefenseSchema = z.object({
  // A field no real user should ever fill — see BookingConfirmForm.tsx
  // for how it's hidden from sighted, keyboard, and screen-reader users
  // alike. Anything other than empty here means it was filled by
  // something reading the DOM, not a person looking at the page.
  website: z.string().optional(),
  // Server-rendered when the summary step loads, compared against the
  // submit time in the Server Action. A gap that's implausibly short
  // for a human to have read the summary and typed three fields is
  // treated as automated.
  formRenderedAt: z.string().regex(/^\d+$/, "Invalid form state"),
});

/** Shape of a row actually written to appointments — service/barber slugs
 * have been resolved to their database ids by this point. */
export const appointmentInsertSchema = z.object({
  service_id: UUID,
  barber_id: UUID,
  date: ISO_DATE,
  start_time: TIME_24H,
  end_time: TIME_24H,
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1),
  status: z.literal("confirmed"),
  confirmation_token: UUID,
});
