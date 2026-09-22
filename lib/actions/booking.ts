"use server";

import type { BarberChoice } from "@/lib/types";
import { ANY_BARBER } from "@/lib/types";
import { bookingSchema, type BookingInput } from "@/lib/booking/schema";
import { getServiceBySlug } from "@/lib/data/services";
import { getAllBarbers, getBarberBySlug } from "@/lib/data/barbers";
import { getAvailableSlots, resolveAnyBarberForSlot, addMinutesToTime, isDayOpenForBarber } from "@/lib/booking/availability";
import { toISODate } from "@/lib/booking/date-utils";
import { createPublicClient } from "@/lib/supabase/server";
import { sendCustomerConfirmationEmail, sendShopNotificationEmail } from "@/lib/email/resend";

/** The shape BookingConfirmForm's useActionState hook tracks across
 * submissions — same pattern as the rest of this portfolio's Server
 * Action forms. */
export type BookingActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof BookingInput, string>>;
  confirmationToken?: string;
};

const GENERIC_TAKEN_MESSAGE = "Sorry — that time was just taken. Please go back and pick another.";

/**
 * `"use server"` makes this a real, independently reachable HTTP
 * endpoint — not just a function this form happens to call — so every
 * check below runs again here regardless of what the browser already
 * validated or displayed. That's the whole reason a second availability
 * check at submit time isn't redundant with the one the calendar/time
 * pages already did: those were reads from minutes (or longer) ago, and
 * nothing stops someone from calling this action directly with a stale
 * or hand-crafted payload. The actual guarantee against two people
 * landing the same slot is the exclusion constraint in
 * supabase/schema.sql — this re-check exists to turn the common case
 * (nobody raced you) into a fast, friendly response instead of always
 * attempting the insert and hoping.
 */
export async function submitBooking(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const raw = {
    serviceSlug: formData.get("serviceSlug"),
    barberChoice: formData.get("barberChoice"),
    date: formData.get("date"),
    time: formData.get("time"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
  };

  const result = bookingSchema.safeParse(raw);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors;
    const fieldErrors: BookingActionState["fieldErrors"] = {};
    (Object.keys(flat) as (keyof BookingInput)[]).forEach((key) => {
      const msg = flat[key]?.[0];
      if (msg) fieldErrors[key] = msg;
    });
    return { status: "error", message: "Please check the form for errors.", fieldErrors };
  }

  const { serviceSlug, barberChoice, date, time, customerName, customerEmail, customerPhone } = result.data;

  const service = await getServiceBySlug(serviceSlug);
  if (!service) {
    return { status: "error", message: "That service is no longer available. Please start over." };
  }

  const resolvedBarberSlug =
    barberChoice === ANY_BARBER
      ? await resolveAnyBarberForSlot(date, time, service.durationMinutes)
      : barberChoice;

  if (!resolvedBarberSlug) {
    return { status: "error", message: GENERIC_TAKEN_MESSAGE };
  }

  const barber = await getBarberBySlug(resolvedBarberSlug);
  if (!barber) {
    return { status: "error", message: "That barber is no longer available. Please start over." };
  }

  // The re-check described above.
  const slots = await getAvailableSlots(barber.slug, date, service.durationMinutes);
  const stillOpen = slots.some((slot) => slot.time === time && slot.available);
  if (!stillOpen) {
    return { status: "error", message: GENERIC_TAKEN_MESSAGE };
  }

  const endTime = addMinutesToTime(time, service.durationMinutes);
  // Generated here rather than left to the column's default so this
  // function already has the value in hand — it needs it for the email
  // and the cancel link regardless, and generating it up front means the
  // insert never has to read anything back afterward (see the comment
  // below on why that matters for what the anon key is allowed to do).
  const confirmationToken = crypto.randomUUID();

  // This insert deliberately uses the public (anon-key) client, not the
  // service-role one — the actual write a customer's browser causes
  // should only ever be able to do what the anon key's RLS policy
  // allows, which is "insert one confirmed appointment," full stop. And
  // deliberately no .select() chained after it: reading the row back
  // would require a select policy on appointments that doesn't exist by
  // design, so an otherwise-successful insert would report as an error.
  // We don't need the row back anyway — we already generated every value
  // that's in it.
  const supabase = createPublicClient();
  const { error } = await supabase.from("appointments").insert({
    service_id: service.id,
    barber_id: barber.id,
    date,
    start_time: time,
    end_time: endTime,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    status: "confirmed",
    confirmation_token: confirmationToken,
  });

  if (error) {
    // 23P01 = exclusion_violation. This is the rare race the re-check
    // above missed — two submissions landing close enough together that
    // both passed their own availability read before either one wrote.
    // The database constraint is what actually catches it; this just
    // translates that into the same friendly message instead of a raw
    // Postgres error reaching the customer.
    if (error.code === "23P01") {
      return { status: "error", message: GENERIC_TAKEN_MESSAGE };
    }
    return { status: "error", message: "Something went wrong booking your appointment. Please try again." };
  }

  // Email is best-effort from here on and must never undo a successful
  // write: the appointment already exists in the database, so the
  // customer already has a real booking whether or not the email about
  // it arrives. Each send is wrapped separately so a failure in one
  // doesn't also skip the other, and both are logged rather than thrown.
  const emailInput = { service, barber, date, time, customerName, customerEmail, customerPhone, confirmationToken };
  try {
    await sendCustomerConfirmationEmail(emailInput);
  } catch (err) {
    console.error("Failed to send customer confirmation email:", err);
  }
  try {
    await sendShopNotificationEmail(emailInput);
  } catch (err) {
    console.error("Failed to send shop notification email:", err);
  }

  return { status: "success", message: "You're booked.", confirmationToken };
}

/**
 * Called from DateStep (a client component) via a plain async function
 * call — this is what a Server Action looks like from the calling side:
 * no fetch(), no API route, Next.js generates the network call for you.
 * Fetches the relevant barber(s) exactly once, then checks every day in
 * the visible month against that same in-memory data, rather than
 * re-querying per calendar cell — the N+1 pattern the JSDoc on
 * isDayOpenForBarber describes avoiding.
 */
export async function getMonthAvailability(
  barberChoice: BarberChoice,
  year: number,
  month: number,
): Promise<{ date: string; available: boolean }[]> {
  const barbers =
    barberChoice === ANY_BARBER
      ? await getAllBarbers()
      : [await getBarberBySlug(barberChoice)].filter((b): b is NonNullable<typeof b> => b !== undefined);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const results: { date: string; available: boolean }[] = [];
  for (const d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    results.push({ date: iso, available: barbers.some((barber) => isDayOpenForBarber(barber, iso)) });
  }
  return results;
}
