import Link from "next/link";
import type { BarberChoice, Service } from "@/lib/types";
import { ANY_BARBER } from "@/lib/types";
import { getBarberBySlug } from "@/lib/data/barbers";
import { resolveAnyBarberForSlot, formatTime12h } from "@/lib/booking/availability";
import { timeStepHref } from "@/lib/booking/booking-params";
import { formatDateLabel } from "@/lib/booking/date-utils";
import { formatDuration } from "@/components/ui/PriceTag";
import { BookingConfirmForm } from "@/components/booking/BookingConfirmForm";

/**
 * Resolves "any available" to one real barber's name for the recap —
 * by the time we're on the summary screen, getSlotsForBarberChoice
 * already confirmed at least one barber is free for this exact date
 * and time, so this just asks which one. A real booking system does
 * the same assignment at confirmation time, not before.
 */
export async function SummaryStep({
  service,
  barberChoice,
  date,
  time,
}: {
  service: Service;
  barberChoice: BarberChoice;
  date: string;
  time: string;
}) {
  const resolvedBarberSlug =
    barberChoice === ANY_BARBER
      ? await resolveAnyBarberForSlot(date, time, service.durationMinutes)
      : barberChoice;
  const barber = resolvedBarberSlug ? await getBarberBySlug(resolvedBarberSlug) : undefined;

  // Deliberately impure: this genuinely needs to be the real wall-clock
  // moment this request rendered, so submitBooking can measure elapsed
  // time against it (see the bot-defense note on BookingConfirmForm's
  // formRenderedAt prop). React's purity rule is guarding against a
  // different problem — a value that silently changes across a
  // re-render — which doesn't apply here: this Server Component already
  // runs its data fetches fresh per request, and this line only ever
  // renders once per request, same as those.
  // eslint-disable-next-line react-hooks/purity -- see comment above
  const formRenderedAt = Date.now();

  return (
    <div>
      <Link href={timeStepHref(service.slug, barberChoice, date, time)} className="text-sm text-ink/70 hover:text-brass-dark">
        ← Change time
      </Link>
      <h1 className="mt-2 font-condensed text-3xl uppercase tracking-wide text-charcoal sm:text-4xl">
        Confirm your booking
      </h1>

      <dl className="mt-8 grid max-w-md gap-4 rounded-2xl border border-clay/60 bg-white/60 p-6">
        <Row label="Service" value={`${service.name} — ${formatDuration(service.durationMinutes)}`} />
        <Row label="Price" value={`$${service.price}`} />
        <Row
          label="Barber"
          value={
            barberChoice === ANY_BARBER
              ? `${barber?.name ?? "Assigned at booking"} (any available)`
              : barber?.name ?? "—"
          }
        />
        <Row label="Date" value={formatDateLabel(date)} />
        <Row label="Time" value={formatTime12h(time)} />
      </dl>

      <div className="mt-8 max-w-md">
        <BookingConfirmForm
          serviceSlug={service.slug}
          barberChoice={barberChoice}
          date={date}
          time={time}
          formRenderedAt={formRenderedAt}
        />
      </div>
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
