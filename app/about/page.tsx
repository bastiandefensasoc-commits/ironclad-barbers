import type { Metadata } from "next";
import Image from "next/image";
import { FadeUp } from "@/components/motion/FadeUp";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Ironclad Barbers has been cutting hair on South Congress since 2004 — two chairs, four barbers, no appointment required.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <FadeUp>
        <h1 className="font-condensed text-4xl uppercase tracking-wide text-charcoal">Our Story</h1>
      </FadeUp>

      <FadeUp delay={0.05}>
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl bg-sand">
          <Image
            src="/images/shop-interior.svg"
            alt="Three barber stations with framed mirrors along the wall, product shelves, and a sunlit window"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </FadeUp>

      <div className="mt-10 space-y-6 leading-relaxed text-ink/80">
        <FadeUp>
          <p>
            Ironclad Barbers opened on South Congress in 2004, in a storefront that used to be a
            shoe repair shop — the old sign is still bolted to the brick out back, we just never
            bothered taking it down. Two chairs then, two chairs now, though we&rsquo;ve long since
            outgrown two barbers. Four of us work the floor these days, and on a Saturday all four
            chairs are usually going at once.
          </p>
        </FadeUp>
        <FadeUp>
          <p>
            We&rsquo;ve never chased a look. No reclaimed-wood accent wall, no menu written like a
            cocktail list. What&rsquo;s kept people coming back for twenty years is simpler than that:
            you get the same cut whether you booked online or walked in ten minutes before
            closing, and if you liked who cut your hair last time, you can ask for them again —
            we keep track.
          </p>
        </FadeUp>
        <FadeUp>
          <p>
            Online booking is new. Everything else about walking through that door isn&rsquo;t —
            still cash or card, still no judgment if it&rsquo;s been four months since your last cut,
            still a shop where the guy waiting on the bench will probably say something about the
            Longhorns whether you asked or not.
          </p>
        </FadeUp>
      </div>
    </div>
  );
}
