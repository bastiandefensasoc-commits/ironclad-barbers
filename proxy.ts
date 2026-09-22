import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * The CSP is generated per-request, not as a static header in
 * next.config.ts, because of one specific requirement: `script-src`
 * can't just be `'self'`. Next.js's App Router injects an inline
 * `<script>` into every page to bootstrap React hydration — that's not
 * something this app's code writes, it's the framework itself, and it
 * runs before any external script would. A CSP that blocked all inline
 * scripts would break every page in production, not just this one's
 * `dangerouslySetInnerHTML` JSON-LD tag.
 *
 * The standard fix is a nonce: a random value generated fresh per
 * request, threaded through to the one inline script tag we actually
 * write (via the `x-nonce` header, read back in Server Components with
 * `headers()`), and sent in the CSP itself. Next.js recognizes the nonce
 * on its own hydration script automatically when it sees one on the
 * response headers set this way — the two other things it needs, a
 * matching `Content-Security-Policy` response header and this nonce
 * forwarded as a request header so the App Router's renderer can see it,
 * are both done below. `'strict-dynamic'` tells the browser "anything
 * loaded BY a nonce'd script is trusted too," which is what lets Next's
 * nonce'd bootstrap script load its own chunk-split JS files — without
 * it, every one of those chunks would need listing individually, which
 * isn't practical with Next's build output.
 *
 * Named/located as `proxy.ts` rather than `middleware.ts` — Next.js
 * 16.3 renamed the convention (same API, same request/response model,
 * new file name) and warns on the old one.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // 'unsafe-inline' here, not on script-src: Tailwind's compiled output
    // is an external stylesheet, but a nonce-per-style-tag approach adds
    // real complexity for a much lower-severity risk than inline script
    // injection — style-based attacks (data exfiltration via CSS
    // selectors, UI redressing) exist but can't run arbitrary JS the way
    // an injected <script> can.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    // The browser never talks to Supabase directly — every query in this
    // app runs server-side (see lib/supabase/server.ts) — so there's
    // nothing for the browser to legitimately fetch() except its own
    // origin's Server Actions and route handlers.
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // Clickjacking defense: refuses to let this site be rendered inside
    // ANY frame, on this or any other origin. See the matching
    // X-Frame-Options header in next.config.ts for the same protection
    // in browsers that don't honor CSP's frame-ancestors.
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Runs on every route except Next's own static asset paths — those
    // are fingerprinted, immutable build output with no user-controlled
    // content to protect, so generating a fresh nonce + header for each
    // one would be pure overhead with no security benefit.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
