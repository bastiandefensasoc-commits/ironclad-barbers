import type { Metadata } from "next";
import { getAppointmentByToken } from "@/lib/data/appointments";
import { getServiceById } from "@/lib/data/services";
import { getBarberById } from "@/lib/data/barbers";
import { formatTime12h } from "@/lib/booking/availability";
import { formatDateLabel } from "@/lib/booking/date-utils";
import { formatDuration } from "@/components/ui/PriceTag";
import { CancelForm } from "@/components/booking/CancelForm";

export const metadata: Metadata = {
  title: "Cancel Appointment",
  robots: { index: false }, // a token-bearing URL has no reason to be crawled or indexed
};

/**
 * Why this page is reached via a token in the URL rather than, say,
 * `/cancel/<appointment id>`: the id is the database's own reference to
 * the row, and reusing it as a public capability would mean it now has
 * to double as a secret — every place it's ever logged, joined against,
 * or shown in a future admin view becomes a place that secret could
 * leak, and if it were short or sequential, someone could just guess
 * `/cancel/1`, `/cancel/2`, … and cancel a stranger's booking.
 * confirmation_token exists for exactly one purpose — proving you have
 * the link that was emailed to you — so it can be treated as sensitive
 * everywhere it appears (this one page) without that spreading anywhere
 * else. It's the same pattern a password-reset link or a calendar
 * invite's "remove me" link uses: possession of the token IS the
 * authorization, since there's no login here to check instead.
 */
export default async function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appointment = await getAppointmentByToken(token);

  if (!appointment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
          We couldn&rsquo;t find that appointment
        </h1>
        <p className="mt-3 text-ink/70">
          This link may be mistyped, or the appointment may have already been cancelled and
          removed. If you think that&rsquo;s wrong, call the shop and we&rsquo;ll sort it out.
        </p>
      </div>
    );
  }

  const [service, barber] = await Promise.all([
    getServiceById(appointment.serviceId),
    getBarberById(appointment.barberId),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
        {appointment.status === "cancelled" ? "Appointment cancelled" : "Cancel appointment"}
      </h1>
      <p className="mt-2 text-ink/70">
        {appointment.status === "cancelled"
          ? "This booking has already been cancelled."
          : appointment.status === "completed"
            ? "This appointment already happened — there's nothing to cancel."
            : `Booked for ${appointment.customerName}.`}
      </p>

      <dl className="mt-8 grid gap-4 rounded-2xl border border-clay/60 bg-white/60 p-6">
        <Row label="Service" value={service ? `${service.name} — ${formatDuration(service.durationMinutes)}` : "—"} />
        <Row label="Barber" value={barber?.name ?? "—"} />
        <Row label="Date" value={formatDateLabel(appointment.date)} />
        <Row label="Time" value={formatTime12h(appointment.startTime)} />
      </dl>

      {appointment.status === "confirmed" && (
        <div className="mt-8">
          <CancelForm token={token} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-clay/50 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-ink/70">{label}</dt>
      <dd className="text-right font-medium text-charcoal">{value}</dd>
    </div>
  );
}
