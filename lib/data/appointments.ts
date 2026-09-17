import type { Appointment } from "@/lib/types";
import { addDays, todayISO } from "@/lib/booking/date-utils";

/**
 * Seeded bookings, relative to today's real date. These exist purely to
 * make the booking demo honest: without them every barber would look
 * wide open every day, which isn't what a real two-chair shop's
 * calendar looks like. This whole file is the piece a real backend
 * replaces outright — getAvailableSlots() in availability.ts reads
 * from this array today and from a database later, and nothing that
 * calls it needs to change either way.
 */
const today = todayISO();

const appointments: Appointment[] = [
  { id: "seed-1", serviceSlug: "classic-cut", barberSlug: "marcus-webb", date: addDays(today, 1), time: "10:00", customerName: "Jake Donovan", email: "jake.donovan@example.com", phone: "512-555-0114" },
  { id: "seed-2", serviceSlug: "skin-fade", barberSlug: "marcus-webb", date: addDays(today, 1), time: "14:00", customerName: "Reggie Voss", email: "reggie.voss@example.com", phone: "512-555-0122" },
  { id: "seed-3", serviceSlug: "hot-towel-shave", barberSlug: "dante-ruiz", date: addDays(today, 2), time: "11:00", customerName: "Colin Ashby", email: "colin.ashby@example.com", phone: "512-555-0139" },
  { id: "seed-4", serviceSlug: "kids-cut", barberSlug: "silas-grant", date: addDays(today, 2), time: "09:00", customerName: "Nora Prescott", email: "nora.prescott@example.com", phone: "512-555-0147" },
  { id: "seed-5", serviceSlug: "cut-and-beard", barberSlug: "owen-bishop", date: addDays(today, 3), time: "15:00", customerName: "Marcus Ihe", email: "marcus.ihe@example.com", phone: "512-555-0158" },
  { id: "seed-6", serviceSlug: "beard-trim", barberSlug: "marcus-webb", date: addDays(today, 3), time: "09:00", customerName: "Tomas Reyes", email: "tomas.reyes@example.com", phone: "512-555-0163" },
  { id: "seed-7", serviceSlug: "skin-fade", barberSlug: "silas-grant", date: addDays(today, 3), time: "13:00", customerName: "Dev Patel", email: "dev.patel@example.com", phone: "512-555-0171" },
  { id: "seed-8", serviceSlug: "classic-cut", barberSlug: "dante-ruiz", date: addDays(today, 4), time: "16:00", customerName: "Elliot Marsh", email: "elliot.marsh@example.com", phone: "512-555-0186" },
  { id: "seed-9", serviceSlug: "hot-towel-shave", barberSlug: "owen-bishop", date: addDays(today, 4), time: "11:00", customerName: "Grant Feldman", email: "grant.feldman@example.com", phone: "512-555-0194" },
  { id: "seed-10", serviceSlug: "cut-and-beard", barberSlug: "marcus-webb", date: addDays(today, 5), time: "12:00", customerName: "Owen Castellano", email: "owen.castellano@example.com", phone: "512-555-0207" },
];

export function getAllAppointments(): Appointment[] {
  return appointments;
}

export function getAppointmentsForBarberOnDate(barberSlug: string, date: string): Appointment[] {
  return appointments.filter((appt) => appt.barberSlug === barberSlug && appt.date === date);
}
