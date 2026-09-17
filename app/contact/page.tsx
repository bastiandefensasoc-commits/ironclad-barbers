import type { Metadata } from "next";
import Link from "next/link";
import { FadeUp } from "@/components/motion/FadeUp";

export const metadata: Metadata = {
  title: "Location & Hours",
  description:
    "Find Ironclad Barbers on South Congress in Austin, TX — hours, parking, and how to reach us.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <FadeUp>
        <h1 className="font-condensed text-4xl uppercase tracking-wide text-charcoal">
          Location &amp; Hours
        </h1>
      </FadeUp>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <FadeUp>
          <div className="space-y-8">
            <div>
              <h2 className="font-condensed text-xl uppercase tracking-wide text-charcoal">
                Find us
              </h2>
              <address className="mt-2 not-italic text-ink/80">
                1418 S Congress Ave
                <br />
                Austin, TX 78704
              </address>
              <p className="mt-2 text-sm text-ink/70">
                Between the taco trailer and the record shop — look for the black awning.
              </p>
            </div>

            <div>
              <h2 className="font-condensed text-xl uppercase tracking-wide text-charcoal">
                Parking
              </h2>
              <p className="mt-2 text-sm text-ink/80">
                Metered street parking out front until 6pm, free after. There&rsquo;s a small lot
                behind the building off Milton St. if the street&rsquo;s full — it&rsquo;s shared with the
                bookstore next door, so leave the spot if you see their delivery truck blocking
                it.
              </p>
            </div>

            <div>
              <h2 className="font-condensed text-xl uppercase tracking-wide text-charcoal">
                Reach us
              </h2>
              <p className="mt-2 text-sm text-ink/80">
                <a href="tel:+15125550134" className="hover:underline">
                  (512) 555-0134
                </a>
                <br />
                <a href="mailto:hello@ironcladbarbers.example.com" className="hover:underline">
                  hello@ironcladbarbers.example.com
                </a>
              </p>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="rounded-2xl bg-charcoal p-6 text-cream">
            <h2 className="font-condensed text-xl uppercase tracking-wide">Hours</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label="Monday" value="10am – 6pm" note="One chair only" />
              <Row label="Tuesday" value="9am – 6pm" />
              <Row label="Wednesday" value="9am – 7pm" />
              <Row label="Thursday" value="9am – 7pm" />
              <Row label="Friday" value="9am – 7pm" />
              <Row label="Saturday" value="9am – 7pm" note="Our busiest day" />
              <Row label="Sunday" value="10am – 7pm" />
            </dl>
            <p className="mt-4 text-xs text-cream/70">
              Walk-ins are always welcome — booking ahead just skips the wait. On a Saturday
              afternoon, that wait can run 30–45 minutes.
            </p>
            <Link
              href="/book"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-brass px-6 text-sm font-semibold text-charcoal hover:bg-brass-dark hover:text-cream"
            >
              Book online
            </Link>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cream/10 py-1.5 last:border-0">
      <dt className="text-cream/80">
        {label}
        {note && <span className="ml-1.5 text-xs text-cream/70">({note})</span>}
      </dt>
      <dd className="text-right text-cream">{value}</dd>
    </div>
  );
}
