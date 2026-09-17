import type { Metadata } from "next";
import { parseBookingState } from "@/lib/booking/booking-params";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { ServiceStep } from "@/components/booking/ServiceStep";
import { BarberStep } from "@/components/booking/BarberStep";
import { DateStep } from "@/components/booking/DateStep";
import { TimeStep } from "@/components/booking/TimeStep";
import { SummaryStep } from "@/components/booking/SummaryStep";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Book a cut, beard trim, or shave at Ironclad Barbers in under a minute — pick a service, a barber, a date, and a time.",
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The whole booking flow is one route. `searchParams` is a Promise
 * here (Next.js resolves it after request headers/cookies are ready),
 * and parseBookingState — the "state machine" described in
 * lib/booking/booking-params.ts — turns it into exactly one of five
 * steps to render. There's no client-side router or wizard component
 * orchestrating this; each step is a normal server-rendered page that
 * happens to share a URL prefix with the others.
 */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const state = parseBookingState(resolvedSearchParams);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <BookingStepper state={state} />
      <div className="mt-8">
        {state.step === "service" && <ServiceStep />}
        {state.step === "barber" && state.service && <BarberStep service={state.service} />}
        {state.step === "date" && state.service && state.barberChoice && (
          <DateStep service={state.service} barberChoice={state.barberChoice} selectedDate={state.date} />
        )}
        {state.step === "time" && state.service && state.barberChoice && state.date && (
          <TimeStep service={state.service} barberChoice={state.barberChoice} date={state.date} />
        )}
        {state.step === "summary" && state.service && state.barberChoice && state.date && state.time && (
          <SummaryStep
            service={state.service}
            barberChoice={state.barberChoice}
            date={state.date}
            time={state.time}
          />
        )}
      </div>
    </div>
  );
}
