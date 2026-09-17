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
};

export default nextConfig;
