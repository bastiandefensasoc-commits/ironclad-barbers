import type { Service } from "@/lib/types";

const services: Service[] = [
  {
    slug: "classic-cut",
    name: "Classic Cut",
    durationMinutes: 30,
    price: 32,
    description:
      "Scissor-and-clipper cut, tailored to how you actually wear it day to day — not a template. Finished with a clean neckline and a hot towel neck shave.",
    icon: "/images/icon-scissors.svg",
  },
  {
    slug: "skin-fade",
    name: "Skin Fade",
    durationMinutes: 40,
    price: 38,
    description:
      "A tight fade taken down to the skin and blended by hand, not just a clipper guard swap. Finished with a straight-edge line-up around the hairline.",
    icon: "/images/icon-clippers.svg",
  },
  {
    slug: "beard-trim",
    name: "Beard Trim",
    durationMinutes: 20,
    price: 20,
    description:
      "Shape and length, cleaned up with a straight-razor edge along the cheek and neckline. Fifteen minutes to look like you didn't need one.",
    icon: "/images/icon-beard.svg",
  },
  {
    slug: "hot-towel-shave",
    name: "Hot Towel Shave",
    durationMinutes: 35,
    price: 40,
    description:
      "The traditional straight-razor shave: hot towel prep to soften the beard, two passes with the blade, and a cold towel finish with balm.",
    icon: "/images/icon-razor.svg",
  },
  {
    slug: "cut-and-beard",
    name: "Cut & Beard Combo",
    durationMinutes: 50,
    price: 52,
    description:
      "A full cut and a full beard trim in one visit, done by the same barber so the two actually match. Our most-booked service.",
    icon: "/images/icon-combo.svg",
  },
  {
    slug: "kids-cut",
    name: "Kids Cut",
    durationMinutes: 25,
    price: 22,
    description:
      "For 12 and under. Quick, patient, and we're used to a squirmy first haircut — no drama, no pressure, a sticker at the end if they want one.",
    icon: "/images/icon-kids.svg",
  },
];

export function getAllServices(): Service[] {
  return services;
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
