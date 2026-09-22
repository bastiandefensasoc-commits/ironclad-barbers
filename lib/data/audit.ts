import { createServiceRoleClient } from "@/lib/supabase/server";

export type AppointmentEventType = "created" | "cancelled";

/**
 * Writes one row to appointment_events — a plain history log, separate
 * from `appointments.status`, so the shop can see what happened to a
 * booking over time (created at X from IP Y, cancelled at Z from IP W)
 * instead of only its current state. Practical value: if a booking gets
 * cancelled and the customer says they never did that, this is the record
 * that shows whether it was cancelled from the same IP that created it,
 * roughly when, and how many times — the difference between "someone
 * asserts X happened" and the shop being able to check.
 *
 * Best-effort and non-blocking, same pattern as the email sends in
 * lib/actions/booking.ts: the appointment write (or status update) that
 * triggered this has already succeeded by the time this runs, so a
 * logging failure here must never undo or block that real result. Callers
 * wrap this in try/catch rather than this function swallowing its own
 * errors, so each call site logs with context about which action failed.
 */
export async function recordAppointmentEvent(
  appointmentId: string,
  eventType: AppointmentEventType,
  ipAddress: string,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("appointment_events").insert({
    appointment_id: appointmentId,
    event_type: eventType,
    ip_address: ipAddress,
  });

  if (error) throw new Error(`Failed to record appointment event: ${error.message}`);
}
