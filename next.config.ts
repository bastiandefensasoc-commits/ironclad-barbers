import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All imagery is hand-authored local SVG (see /public/images) — every
    // file is ours, not user-uploaded, which is the risk this flag guards
    // against, so allowing SVG through next/image is safe here.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Never ship source maps to the browser in production — an attacker (or
  // anyone) with a .map file can reconstruct original, unminified source
  // from the deployed bundle, which is a lot more to read than minified
  // JS ever is. Nothing about debugging THIS app's traffic in production
  // is worth that trade.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        // Everything except the CSP, which is per-request and lives in
        // middleware.ts (see that file for why). These are static and
        // apply the same way to every route, so they belong here instead.
        source: "/:path*",
        headers: [
          {
            // Tells browsers to only ever reach this site over HTTPS, for
            // a full two years, including subdomains — even if someone
            // types or clicks a plain http:// link. Without this, that
            // first HTTP request is a real opening for a
            // man-in-the-middle to intercept or downgrade it before any
            // redirect to HTTPS can happen. `preload` opts into browsers'
            // hardcoded HSTS list, closing that gap even on a site
            // nobody's ever visited before.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Stops the browser from trying to guess a file's type from
            // its content instead of trusting the Content-Type header —
            // the classic exploit this blocks is an uploaded/served file
            // that's technically a .txt or .jpg but starts with content a
            // browser will "helpfully" reinterpret as HTML/JS and
            // execute. This app doesn't serve user uploads, but the
            // header costs nothing and removes the class of bug entirely
            // rather than relying on every response being right forever.
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Backstop for browsers that don't honor CSP's
            // frame-ancestors (see middleware.ts) — refuses to let this
            // site be embedded in a frame anywhere, which is what
            // prevents clickjacking: a malicious page can't overlay this
            // site's real booking/cancel buttons under invisible content
            // of its own and trick a click into hitting ours instead.
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Controls what this site sends as the Referer header when a
            // user clicks a link OFF of it. Appointment cancellation
            // links contain a UUID token in the URL — with a looser
            // policy, following an outbound link from a page that had
            // that token in its address bar could leak it to a
            // third-party site's server logs via Referer.
            // strict-origin-when-cross-origin sends the full URL only to
            // same-origin requests, and just the origin (no path/query,
            // so no token) cross-origin.
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Explicitly denies every powerful browser feature this site
            // has no use for. None of these are used anywhere in the
            // app, so this only closes off what an injected or
            // compromised script could reach for — it can't be a
            // functionality regression for something that was never
            // used to begin with.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
