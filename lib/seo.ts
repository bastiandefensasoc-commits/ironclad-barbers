/**
 * Vercel exposes the production domain at build time via
 * VERCEL_PROJECT_PRODUCTION_URL (no protocol). Falling back to
 * localhost keeps `npm run dev` and local builds working without an
 * env file. Every page's metadataBase, sitemap, robots, and JSON-LD
 * import this one constant rather than hardcoding their own copy.
 */
export const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path}`;
}

/**
 * HairSalon is schema.org's closest fit for a barbershop — there's no
 * dedicated "Barbershop" type, and HairSalon is what Google's own
 * documentation points local-business barbershops toward.
 */
export function buildHairSalonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: "Ironclad Barbers",
    image: absoluteUrl("/images/hero-barbershop.svg"),
    "@id": siteUrl,
    url: siteUrl,
    telephone: "+1-512-555-0134",
    priceRange: "$20-$52",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1418 S Congress Ave",
      addressLocality: "Austin",
      addressRegion: "TX",
      postalCode: "78704",
      addressCountry: "US",
    },
    openingHoursSpecification: [
      // Monday is deliberately absent — the shop is closed shop-wide that
      // day (see supabase/seed.sql), and schema.org's convention for a
      // closed day is to omit it rather than list a zero-length span.
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "10:00", closes: "19:00" },
    ],
  };
}
