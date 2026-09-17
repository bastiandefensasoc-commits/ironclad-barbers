"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileNav } from "@/components/layout/MobileNav";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/barbers", label: "Barbers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * `min-h-11` (44px) on every tappable element here isn't decorative —
 * it's the minimum touch-target size the brief calls for, and it
 * matters more on this site than most: the booking flow is the whole
 * point, and most bookings happen on a phone.
 */
export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-clay/60 bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-condensed text-2xl uppercase tracking-wide text-charcoal">
          Ironclad Barbers
        </Link>

        <nav className="hidden gap-8 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center text-sm font-medium text-ink hover:text-brass-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/book"
            className="hidden min-h-11 items-center justify-center rounded-full bg-brass px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-brass-dark hover:text-cream sm:flex"
          >
            Book Now
          </Link>

          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal hover:bg-sand md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} links={navLinks} />
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
