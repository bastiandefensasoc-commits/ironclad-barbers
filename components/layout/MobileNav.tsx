"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileNav({ open, onClose, links }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-charcoal md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-condensed text-2xl uppercase tracking-wide text-cream">
              Ironclad Barbers
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-full text-cream hover:bg-charcoal-light"
            >
              ✕
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="rounded-lg px-2 py-3 font-condensed text-3xl uppercase tracking-wide text-cream"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={onClose}
              className="mt-4 flex h-14 items-center justify-center rounded-full bg-brass px-6 text-base font-semibold text-charcoal"
            >
              Book Now
            </Link>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
