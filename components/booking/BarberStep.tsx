import Link from "next/link";
import Image from "next/image";
import type { Service } from "@/lib/types";
import { ANY_BARBER } from "@/lib/types";
import { getAllBarbers } from "@/lib/data/barbers";
import { barberStepHref } from "@/lib/booking/booking-params";
import { Badge } from "@/components/ui/Badge";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";

export async function BarberStep({ service }: { service: Service }) {
  const barbers = await getAllBarbers();

  return (
    <div>
      <Link href="/book" className="text-sm text-ink/70 hover:text-brass-dark">
        ← Change service
      </Link>
      <h1 className="mt-2 font-condensed text-3xl uppercase tracking-wide text-charcoal sm:text-4xl">
        Choose a barber
      </h1>
      <p className="mt-2 text-ink/70">For your {service.name.toLowerCase()}.</p>

      <StaggerContainer className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StaggerItem>
          <Link
            href={barberStepHref(service.slug, ANY_BARBER)}
            className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-clay bg-white/40 p-4 text-center transition-colors hover:border-brass"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brass/15 text-xl text-brass-dark">
              ✓
            </span>
            <span className="font-condensed text-lg uppercase tracking-wide text-charcoal">
              Any available
            </span>
            <span className="text-xs text-ink/70">Soonest slot, any of the four</span>
          </Link>
        </StaggerItem>

        {barbers.map((barber) => (
          <StaggerItem key={barber.slug}>
            <Link
              href={barberStepHref(service.slug, barber.slug)}
              className="group block h-full overflow-hidden rounded-2xl bg-white/50 transition-colors hover:bg-white"
            >
              <div className="relative aspect-square overflow-hidden bg-sand">
                <Image
                  src={barber.photo.src}
                  alt={barber.photo.alt}
                  fill
                  sizes="(min-width: 1024px) 18vw, 40vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="space-y-1.5 p-3">
                <p className="font-condensed text-lg uppercase tracking-wide text-charcoal">{barber.name}</p>
                <Badge>{barber.specialties[0]}</Badge>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
