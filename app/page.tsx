import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { getAllServices } from "@/lib/data/services";
import { getAllBarbers } from "@/lib/data/barbers";
import { ServiceGrid } from "@/components/services/ServiceGrid";
import { BarberGrid } from "@/components/barbers/BarberGrid";
import { FadeUp } from "@/components/motion/FadeUp";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { buildHairSalonJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Ironclad Barbers — Barbershop in Austin, TX",
  description:
    "A two-chair barbershop on South Congress in Austin. Classic cuts, beard work, and hot towel shaves from four barbers — book online in under a minute.",
};

const trustStats = [
  { value: "22 years", label: "cutting hair on South Congress" },
  { value: "45,000+", label: "cuts given since we opened" },
  { value: "Walk-ins", label: "always welcome, no appointment required" },
];

const howItWorks = [
  {
    number: "01",
    title: "Pick your service and barber",
    body: "Choose what you're in for and who's doing it — or pick \"any available\" if you just want the soonest chair.",
  },
  {
    number: "02",
    title: "Choose a time that actually works",
    body: "Real availability, not a guess — booked and full days are grayed out, not hidden, so you're never picking blind.",
  },
  {
    number: "03",
    title: "Show up, we'll be ready",
    body: "No check-in, no waiting room small talk you didn't sign up for. Your barber knows you're coming.",
  },
];

const reviews = [
  {
    quote: "Been getting my fade here for three years. Marcus knows exactly what I mean by \"the usual\" without me having to explain it.",
    name: "T. Alvarez",
  },
  {
    quote: "First hot towel shave of my life. Dante talked me through every step without making it feel like an upsell.",
    name: "J. Whitfield",
  },
  {
    quote: "Took my 6-year-old for his first real haircut. Silas was patient with him in a way I genuinely didn't expect.",
    name: "R. Okonkwo",
  },
];

const faqs = [
  {
    question: "Do you take walk-ins?",
    answer:
      "Always. Booking online just means you skip the wait — on a busy Saturday afternoon that wait can run 30 to 45 minutes, so booking ahead is worth it if your schedule's tight.",
  },
  {
    question: "What happens if I'm running late?",
    answer:
      "Call the shop. If you're more than 10 minutes past your slot and haven't called, we may need to give it to the next walk-in — but a heads-up almost always buys you grace.",
  },
  {
    question: "Can I request the same barber again?",
    answer:
      "Yes, and most regulars do. The booking flow lets you pick a specific barber by name, or their individual page shows their hours if you want to plan around them.",
  },
  {
    question: "Do prices ever change based on hair length or style?",
    answer:
      "No — the price on the services page is the price at the register. If something genuinely unusual comes up mid-cut, your barber will tell you before doing anything extra, not after.",
  },
];

export default async function HomePage() {
  const services = await getAllServices();
  const barbers = await getAllBarbers();

  const jsonLd = buildHairSalonJsonLd();
  // Browsers don't execute application/ld+json as script, so it's likely
  // exempt from script-src enforcement regardless — the nonce is added
  // anyway as cheap insurance against relying on that distinction holding
  // in every browser. See middleware.ts for where this value comes from.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <div>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <FadeUp>
            <h1 className="font-condensed text-5xl uppercase leading-[0.95] tracking-wide text-charcoal sm:text-6xl">
              A haircut you don&rsquo;t have to explain twice.
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/80">
              Ironclad Barbers is a two-chair shop on South Congress — classic cuts, beard work,
              and hot towel shaves from four barbers who&rsquo;ve heard every version of &ldquo;just
              take a little off the top.&rdquo;
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="flex h-12 items-center justify-center rounded-full bg-brass px-7 text-sm font-semibold text-charcoal transition-colors hover:bg-brass-dark hover:text-cream"
              >
                Book Now
              </Link>
              <Link
                href="/services"
                className="flex h-12 items-center justify-center rounded-full border border-charcoal px-7 text-sm font-medium text-charcoal transition-colors hover:bg-sand"
              >
                See services &amp; prices
              </Link>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src="/images/hero-barbershop.svg"
                alt="A barber chair facing a large framed mirror, with a shelf of grooming products and a brass barber pole"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-clay/60 bg-sand py-10">
        <StaggerContainer className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-3 sm:px-6">
          {trustStats.map((stat) => (
            <StaggerItem key={stat.label} className="text-center">
              <p className="font-condensed text-3xl uppercase tracking-wide text-charcoal">{stat.value}</p>
              <p className="mt-1 text-sm text-ink/70">{stat.label}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Services preview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <FadeUp>
          <div className="flex items-baseline justify-between">
            <h2 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
              Services &amp; Pricing
            </h2>
            <Link href="/services" className="text-sm font-medium text-brass-dark hover:underline">
              Full list →
            </Link>
          </div>
        </FadeUp>
        <div className="mt-8">
          <ServiceGrid services={services} />
        </div>
      </section>

      {/* Meet the barbers */}
      <section className="bg-charcoal py-16 text-cream">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp>
            <div className="flex items-baseline justify-between">
              <h2 className="font-condensed text-3xl uppercase tracking-wide">Meet the Barbers</h2>
              <Link href="/barbers" className="text-sm font-medium text-brass hover:underline">
                All bios →
              </Link>
            </div>
          </FadeUp>
          <div className="mt-8">
            <BarberGrid barbers={barbers} />
          </div>
        </div>
      </section>

      {/* How booking works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <FadeUp>
          <h2 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
            How Booking Works
          </h2>
        </FadeUp>
        <StaggerContainer className="mt-10 grid gap-10 sm:grid-cols-3">
          {howItWorks.map((step) => (
            <StaggerItem key={step.number}>
              <p className="font-condensed text-4xl text-brass">{step.number}</p>
              <h3 className="mt-2 font-condensed text-xl uppercase tracking-wide text-charcoal">
                {step.title}
              </h3>
              <p className="mt-2 text-ink/80">{step.body}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
        <FadeUp delay={0.1}>
          <Link
            href="/book"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brass px-7 text-sm font-semibold text-charcoal hover:bg-brass-dark hover:text-cream"
          >
            Start booking
          </Link>
        </FadeUp>
      </section>

      {/* Shop interior */}
      <section className="bg-sand py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <FadeUp>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
              <Image
                src="/images/shop-interior.svg"
                alt="Three barber stations with framed mirrors along the wall, product shelves, and a sunlit window"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
              The Shop
            </h2>
            <p className="mt-3 text-ink/80">
              Two chairs, a waiting bench that&rsquo;s seen better days, and a barber pole that&rsquo;s been
              spinning since 2004. We didn&rsquo;t design it to look like a barbershop — it just is
              one, the same way it&rsquo;s been for twenty-two years.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <FadeUp>
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
              What Clients Say
            </h2>
            <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-ink/70">
              Sample reviews
            </span>
          </div>
          <p className="mt-2 text-sm text-ink/70">
            Illustrative content for this portfolio build — not real customer testimonials.
          </p>
        </FadeUp>
        <StaggerContainer className="mt-8 grid gap-6 sm:grid-cols-3">
          {reviews.map((review) => (
            <StaggerItem key={review.name}>
              <div className="h-full rounded-2xl bg-sand p-6">
                <span className="text-brass-dark" aria-hidden="true">★★★★★</span>
                <span className="sr-only">Rated 5 out of 5 stars</span>
                <p className="mt-3 text-ink/80">&ldquo;{review.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-charcoal">{review.name}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Hours and location */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <FadeUp>
          <div className="grid gap-8 rounded-3xl bg-charcoal p-8 text-cream sm:grid-cols-2 sm:p-12">
            <div>
              <h2 className="font-condensed text-3xl uppercase tracking-wide">Hours &amp; Location</h2>
              <p className="mt-3 text-cream/80">
                1418 S Congress Ave, Austin, TX — between the taco trailer and the record shop.
              </p>
              <Link href="/contact" className="mt-5 inline-block text-sm font-medium text-brass hover:underline">
                Full hours &amp; parking →
              </Link>
            </div>
            <div className="text-cream/80">
              <dl className="space-y-1">
                <div className="flex justify-between gap-4 border-b border-cream/15 py-2">
                  <dt>Tue – Fri</dt>
                  <dd>9am – 7pm</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-cream/15 py-2">
                  <dt>Saturday</dt>
                  <dd>9am – 7pm</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-cream/15 py-2">
                  <dt>Sunday</dt>
                  <dd>10am – 7pm</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt>Monday</dt>
                  <dd>Closed</dd>
                </div>
              </dl>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Gift cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <FadeUp>
          <div className="grid gap-8 rounded-3xl border border-brass/40 bg-brass/10 p-8 sm:grid-cols-[1fr_auto] sm:items-center sm:p-12">
            <div>
              <h2 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
                Gift Cards
              </h2>
              <p className="mt-3 max-w-xl text-ink/80">
                Available in-shop or over the phone — ask any barber, or call ahead and we&rsquo;ll have
                one ready at the register. Online gift card purchase is coming with the next
                phase of this site.
              </p>
            </div>
            <Link
              href="/contact"
              className="flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-charcoal px-7 text-sm font-semibold text-cream hover:bg-charcoal-light"
            >
              Ask in-shop
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* FAQ */}
      <section className="bg-sand py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FadeUp>
            <h2 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
              Questions Before You Book
            </h2>
          </FadeUp>
          <StaggerContainer className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <StaggerItem key={faq.question}>
                <h3 className="font-condensed text-xl uppercase tracking-wide text-charcoal">
                  {faq.question}
                </h3>
                <p className="mt-2 text-ink/80">{faq.answer}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-charcoal-light py-20">
        <FadeUp>
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="font-condensed text-4xl uppercase tracking-wide text-cream">
              Your chair is waiting.
            </h2>
            <p className="mt-3 text-cream/75">
              Pick a service, pick a barber, pick a time. Takes less time than parking will.
            </p>
            <Link
              href="/book"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-brass px-8 text-sm font-semibold text-charcoal transition-colors hover:bg-cream"
            >
              Book Now
            </Link>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
