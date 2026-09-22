import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBarbers, getBarberBySlug } from "@/lib/data/barbers";
import { formatDateLabel, isPastDate, dayOfWeek } from "@/lib/booking/date-utils";
import { Badge } from "@/components/ui/Badge";
import { FadeUp } from "@/components/motion/FadeUp";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function generateStaticParams() {
  const barbers = await getAllBarbers();
  return barbers.map((barber) => ({ slug: barber.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const barber = await getBarberBySlug(slug);
  if (!barber) return {};

  return {
    title: barber.name,
    description: barber.bio.slice(0, 155),
  };
}

export default async function BarberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barber = await getBarberBySlug(slug);
  if (!barber) notFound();

  // Mondays are excluded here even though they're technically in
  // daysOff — every barber's working_hours already shows Monday as
  // closed (see supabase/seed.sql), so listing ~26 individually-seeded
  // Monday dates would just be noise on top of what "Weekly hours"
  // already says. This shows only the genuine one-off exceptions.
  const upcomingDaysOff = barber.daysOff.filter((date) => !isPastDate(date) && dayOfWeek(date) !== 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <FadeUp>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
            <Image
              src={barber.photo.src}
              alt={barber.photo.alt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="flex flex-wrap gap-1.5">
            {barber.specialties.map((specialty) => (
              <Badge key={specialty}>{specialty}</Badge>
            ))}
          </div>
          <h1 className="mt-4 font-condensed text-4xl uppercase tracking-wide text-charcoal">
            {barber.name}
          </h1>
          <p className="mt-4 text-ink/80">{barber.bio}</p>

          <div className="mt-8 rounded-2xl border border-clay/60 bg-white/60 p-5">
            <h2 className="font-condensed text-xl uppercase tracking-wide text-charcoal">
              Weekly hours
            </h2>
            <dl className="mt-3 space-y-1.5">
              {WEEKDAY_NAMES.map((name, index) => {
                const hours = barber.workingHours[index];
                return (
                  <div key={name} className="flex justify-between gap-4 text-sm">
                    <dt className="text-ink/70">{name}</dt>
                    <dd className={hours ? "text-ink" : "text-ink/70"}>
                      {hours ? `${hours.start} – ${hours.end}` : "Closed"}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {upcomingDaysOff.length > 0 && (
              <p className="mt-3 border-t border-clay/50 pt-3 text-xs text-ink/70">
                Also off: {upcomingDaysOff.map(formatDateLabel).join(", ")}
              </p>
            )}
          </div>

          <Link
            href="/book"
            className="mt-6 flex h-12 max-w-xs items-center justify-center rounded-full bg-brass px-7 text-sm font-semibold text-charcoal transition-colors hover:bg-brass-dark hover:text-cream"
          >
            Book with {barber.name.split(" ")[0]}
          </Link>
          <p className="mt-2 text-xs text-ink/70">
            Pick a service first — you&rsquo;ll choose {barber.name.split(" ")[0]} in the next step.
          </p>
        </FadeUp>
      </div>
    </div>
  );
}
