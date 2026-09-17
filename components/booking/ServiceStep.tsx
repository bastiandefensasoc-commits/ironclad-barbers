import { getAllServices } from "@/lib/data/services";
import { ServiceGrid } from "@/components/services/ServiceGrid";

/**
 * Server component — no client hook needed. Selecting a service is
 * just a link to `/book?service=<slug>`, which re-requests this same
 * page with a new search param; the server re-derives the step from
 * scratch (see parseBookingState). Reuses the same <ServiceGrid> the
 * standalone /services page renders, since "pick a service" looks
 * identical in both places and both already link to this exact URL.
 */
export function ServiceStep() {
  return (
    <div>
      <h1 className="font-condensed text-3xl uppercase tracking-wide text-charcoal sm:text-4xl">
        Book an appointment
      </h1>
      <p className="mt-2 text-ink/70">First, what are you in for?</p>
      <div className="mt-8">
        <ServiceGrid services={getAllServices()} showDescription />
      </div>
    </div>
  );
}
