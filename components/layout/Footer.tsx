import Link from "next/link";

const columns = [
  {
    heading: "Book",
    links: [
      { href: "/book", label: "Book an appointment" },
      { href: "/services", label: "Services & pricing" },
      { href: "/barbers", label: "Our barbers" },
    ],
  },
  {
    heading: "Shop",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/contact", label: "Location & hours" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-clay/60 bg-charcoal text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-condensed text-2xl uppercase tracking-wide">Ironclad Barbers</p>
          <p className="mt-3 max-w-xs text-sm text-cream/70">
            A two-chair barbershop in Austin, Texas. Classic cuts, beard work, hot towel shaves —
            no appointment required, but booking saves you the wait.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <p className="text-sm font-medium tracking-wide text-cream/60">{column.heading}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-cream/90 hover:text-cream hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-cream/10 px-4 py-6 text-center text-xs text-cream/70 sm:px-6">
        © {new Date().getFullYear()} Ironclad Barbers. 1418 S Congress Ave, Austin, TX.
      </div>
    </footer>
  );
}
