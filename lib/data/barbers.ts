import type { Barber, WorkingHours } from "@/lib/types";
import { addDays, todayISO } from "@/lib/booking/date-utils";

/** Days off are generated relative to today's real date at load time, so the
 * demo calendar always shows a believable upcoming closure instead of a
 * hardcoded date that quietly drifts into the past. */
const today = todayISO();

const marcusHours: WorkingHours = {
  0: null,
  1: null,
  2: { start: "09:00", end: "18:00" },
  3: { start: "09:00", end: "18:00" },
  4: { start: "09:00", end: "18:00" },
  5: { start: "09:00", end: "18:00" },
  6: { start: "09:00", end: "18:00" },
};

const danteHours: WorkingHours = {
  0: { start: "10:00", end: "19:00" },
  1: null,
  2: null,
  3: { start: "10:00", end: "19:00" },
  4: { start: "10:00", end: "19:00" },
  5: { start: "10:00", end: "19:00" },
  6: { start: "10:00", end: "19:00" },
};

const silasHours: WorkingHours = {
  0: null,
  1: null,
  2: { start: "09:00", end: "17:00" },
  3: { start: "09:00", end: "17:00" },
  4: { start: "09:00", end: "17:00" },
  5: { start: "09:00", end: "17:00" },
  6: { start: "09:00", end: "15:00" },
};

const owenHours: WorkingHours = {
  0: { start: "10:00", end: "18:00" },
  1: { start: "10:00", end: "18:00" },
  2: null,
  3: null,
  4: { start: "10:00", end: "18:00" },
  5: { start: "10:00", end: "18:00" },
  6: { start: "10:00", end: "18:00" },
};

const barbers: Barber[] = [
  {
    slug: "marcus-webb",
    name: "Marcus Webb",
    bio: "Marcus has been behind the chair for twelve years and has run Ironclad's floor since it opened. He built his name on fades — tight, blended, no visible line where the guard changed — and he's the one the other three barbers ask when their own fade looks slightly off. Ask him for a skin fade and he'll ask what you actually do all week before he picks a guard.",
    specialties: ["Skin Fades", "Beard Work", "Hot Towel Shaves"],
    photo: { src: "/images/barber-1.svg", alt: "Illustrated portrait of Marcus Webb, a barber with a full dark beard" },
    workingHours: marcusHours,
    daysOff: [addDays(today, 9)],
  },
  {
    slug: "dante-ruiz",
    name: "Dante Ruiz",
    bio: "Dante trained in classic barbering — scissor-over-comb, straight-razor shaves, the stuff that doesn't show up on a clipper-guard chart. He's the one to book if you want a cut that still looks like a haircut and not a buzz with a taper. Regulars mostly book him for the hot towel shave; he treats fifteen minutes of hot towel prep as non-negotiable, weekday rush or not.",
    specialties: ["Classic Cuts", "Hot Towel Shaves"],
    photo: { src: "/images/barber-2.svg", alt: "Illustrated portrait of Dante Ruiz, a clean-shaven barber with slicked side-parted hair" },
    workingHours: danteHours,
    daysOff: [addDays(today, 14)],
  },
  {
    slug: "silas-grant",
    name: "Silas Grant",
    bio: "Silas co-owns the shop with his brother-in-law and still takes a full chair of clients most days — he's just not around past mid-afternoon on Saturdays anymore. He's fast with kids without rushing them, which is why half our under-12 bookings ask for him by name, and he's particular about fade lines being straight, not just close.",
    specialties: ["Skin Fades", "Kids Cuts"],
    photo: { src: "/images/barber-3.svg", alt: "Illustrated portrait of Silas Grant, a barber with a mustache and short tousled hair" },
    workingHours: silasHours,
    daysOff: [addDays(today, 5)],
  },
  {
    slug: "owen-bishop",
    name: "Owen Bishop",
    bio: "Owen is the newest chair at Ironclad, three years in after an apprenticeship downtown, and he's the reason the shop is open Sundays and Mondays now. He leans classic — clean cuts, sharp beard lines — and he's patient with anyone who walks in without a clear idea of what they want, which is most first-time walk-ins.",
    specialties: ["Classic Cuts", "Beard Trims"],
    photo: { src: "/images/barber-4.svg", alt: "Illustrated portrait of Owen Bishop, a barber with a light beard and short textured hair" },
    workingHours: owenHours,
    daysOff: [addDays(today, 11)],
  },
];

export function getAllBarbers(): Barber[] {
  return barbers;
}

export function getBarberBySlug(slug: string): Barber | undefined {
  return barbers.find((barber) => barber.slug === slug);
}
