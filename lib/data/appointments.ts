import type { Appointment, AppointmentStatus } from "@/lib/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface AppointmentRow {
  id: string;
  created_at: string;
  service_id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: AppointmentStatus;
  confirmation_token: string;
}

const SELECT_COLUMNS =
  "id, created_at, service_id, barber_id, date, start_time, end_time, customer_name, customer_email, customer_phone, status, confirmation_token";

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    createdAt: row.created_at,
    serviceId: row.service_id,
    barberId: row.barber_id,
    date: row.date,
    // Postgres returns `time` columns as "HH:mm:ss" — trim to "HH:mm" to
    // match the "HH:mm" format used everywhere else in the app.
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    status: row.status,
    confirmationToken: row.confirmation_token,
  };
}

/**
 * Every confirmed appointment for one barber on one day — the read
 * availability.ts needs to know which slots are already taken. This has
 * to use the service-role client: the whole point of "no public reads"
 * on appointments is that the anon key can't see who else has booked,
 * so computing availability (which inherently requires seeing other
 * customers' confirmed times, just not their names/emails) is one of the
 * few operations in this app that's genuinely privileged.
 */
export async function getConfirmedAppointmentsForBarberOnDate(
  barberId: string,
  date: string,
): Promise<Appointment[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_COLUMNS)
    .eq("barber_id", barberId)
    .eq("date", date)
    .eq("status", "confirmed");

  if (error) throw new Error(`Failed to load appointments: ${error.message}`);
  return (data ?? []).map(toAppointment);
}

export async function getAppointmentByToken(token: string): Promise<Appointment | undefined> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT_COLUMNS)
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error) throw new Error(`Failed to load appointment: ${error.message}`);
  return data ? toAppointment(data) : undefined;
}

export async function updateAppointmentStatus(token: string, status: AppointmentStatus): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("confirmation_token", token);

  if (error) throw new Error(`Failed to update appointment: ${error.message}`);
}
