"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Next.js already redacts thrown error messages from Server
 * Components/Actions in production builds by default — what actually
 * reaches this boundary's `error` prop there is a generic, stripped
 * Error with no message or stack. This file exists to control what the
 * PAGE looks like when that happens (this app's own design, not Next's
 * default white error screen), not to add redaction that wasn't already
 * there. `error.message` is deliberately never rendered below, even
 * though it's technically available on the object, so this stays safe
 * regardless of which environment it runs in.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Full detail goes to the server/build log only, keyed by digest so
    // it can be cross-referenced without ever showing the customer
    // anything about what actually failed.
    console.error("Unhandled error boundary:", error.digest ?? error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-condensed text-3xl uppercase tracking-wide text-charcoal">
        Something went wrong
      </h1>
      <p className="mt-3 text-ink/80">
        We hit a snag loading this page. It&rsquo;s on us — try again, or head back home.
      </p>
      <div className="mt-7 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center justify-center rounded-full bg-brass px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-brass-dark hover:text-cream"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-full border border-charcoal px-6 text-sm font-medium text-charcoal transition-colors hover:bg-sand"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
