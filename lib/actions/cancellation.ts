"use server";

import { getAppointmentByToken, updateAppointmentStatus } from "@/lib/data/appointments";

export type CancelActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Looking up and updating by token both go through the service-role
 * client (inside lib/data/appointments.ts) rather than RLS, because
 * there's no anon policy that could express this safely: RLS policies
 * grant access based on the ROLE making the request, not on "does this
 * particular request happen to know a specific token value." That's a
 * job for application logic — this function IS the check. It looks up
 * the one row matching the token, confirms it's actually cancellable,
 * and only then updates it. Nothing about that flow should be reachable
 * any other way, which is also why there's deliberately no
 * "list appointments" admin view anywhere in this app yet — that's
 * square in the scope of the phase-3 security pass, not this one.
 */
export async function cancelAppointment(
  _prevState: CancelActionState,
  formData: FormData,
): Promise<CancelActionState> {
  const token = formData.get("token");
  if (typeof token !== "string" || token.length === 0) {
    return { status: "error", message: "Missing cancellation link." };
  }

  const appointment = await getAppointmentByToken(token);
  if (!appointment) {
    return { status: "error", message: "We couldn't find that appointment." };
  }
  if (appointment.status === "cancelled") {
    return { status: "success", message: "This appointment is already cancelled." };
  }
  if (appointment.status === "completed") {
    return { status: "error", message: "This appointment already happened and can't be cancelled." };
  }

  await updateAppointmentStatus(token, "cancelled");
  return { status: "success", message: "Your appointment has been cancelled." };
}
