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
