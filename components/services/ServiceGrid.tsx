import Link from "next/link";
import Image from "next/image";
import type { Service } from "@/lib/types";
import { PriceTag, formatDuration } from "@/components/ui/PriceTag";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";

/**
 * `showDescription` is off on the home page's preview (keeps that
 * section scannable) and on for the full /services page — one
 * component, two densities, instead of a near-duplicate component.
 */
export function ServiceGrid({ services, showDescription = false }: { services: Service[]; showDescription?: boolean }) {
  return (
    <StaggerContainer className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <StaggerItem key={service.slug}>
          <Link
            href={`/book?service=${service.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-clay/60 bg-white/50 p-6 transition-colors hover:border-brass hover:bg-white"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              <Image src={service.icon} alt="" fill sizes="48px" />
            </div>
            <p className="mt-4 font-condensed text-2xl uppercase tracking-wide text-charcoal">
              {service.name}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-ink/70">
              <span>{formatDuration(service.durationMinutes)}</span>
              <span aria-hidden="true">·</span>
              <PriceTag amount={service.price} className="font-medium text-brass-dark" />
            </div>
            {showDescription && <p className="mt-3 text-sm text-ink/80">{service.description}</p>}
            <span className="mt-4 inline-block text-sm font-medium text-brass-dark group-hover:underline">
              Book this →
            </span>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
