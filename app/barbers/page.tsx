import type { Metadata } from "next";
import { getAllBarbers } from "@/lib/data/barbers";
import { BarberGrid } from "@/components/barbers/BarberGrid";
import { FadeUp } from "@/components/motion/FadeUp";

export const metadata: Metadata = {
  title: "Our Barbers",
  description:
    "Meet the four barbers at Ironclad Barbers in Austin — specialties, bios, and each barber's own availability.",
};

export default async function BarbersPage() {
  const barbers = await getAllBarbers();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <FadeUp>
        <h1 className="font-condensed text-4xl uppercase tracking-wide text-charcoal">
          Our Barbers
        </h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Four chairs, four ways of working. Book whoever you like by name, or pick &ldquo;any
          available&rdquo; when you just need the soonest chair.
        </p>
      </FadeUp>
      <div className="mt-10">
        <BarberGrid barbers={barbers} />
      </div>
    </div>
  );
}
