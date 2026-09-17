import Link from "next/link";
import Image from "next/image";
import type { Barber } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function BarberCard({ barber }: { barber: Barber }) {
  return (
    <Link
      href={`/barbers/${barber.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white/50 transition-colors hover:bg-white"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Image
          src={barber.photo.src}
          alt={barber.photo.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="space-y-2 p-4">
        <p className="font-condensed text-xl uppercase tracking-wide text-charcoal">{barber.name}</p>
        <div className="flex flex-wrap gap-1.5">
          {barber.specialties.slice(0, 2).map((specialty) => (
            <Badge key={specialty}>{specialty}</Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
