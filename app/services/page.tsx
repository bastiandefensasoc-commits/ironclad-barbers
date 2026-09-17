import type { Metadata } from "next";
import { getAllServices } from "@/lib/data/services";
import { ServiceGrid } from "@/components/services/ServiceGrid";
import { FadeUp } from "@/components/motion/FadeUp";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description:
    "Classic cuts, skin fades, beard trims, and hot towel shaves at Ironclad Barbers in Austin — see durations and prices for every service.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <FadeUp>
        <h1 className="font-condensed text-4xl uppercase tracking-wide text-charcoal">
          Services &amp; Pricing
        </h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          No hidden add-ons. The price on the card is the price at the register, tip not
          included.
        </p>
      </FadeUp>
      <div className="mt-10">
        <ServiceGrid services={getAllServices()} showDescription />
      </div>
    </div>
  );
}
