import { headers } from "next/headers";

/**
 * Server Actions don't receive a Request object the way Route Handlers
 * do, but they can still read the incoming request's headers via
 * next/headers — Vercel's edge network sets `x-forwarded-for` on every
 * request that reaches this app, listing the original client first,
 * followed by any intermediate proxies. Taking the first entry is the
 * standard approach; anything after it could have been appended by a
 * hop we don't control, so it isn't trustworthy the same way.
 *
 * Falls back to a fixed placeholder rather than throwing if the header
 * is somehow absent (e.g. local dev without Vercel's proxy in front) —
 * rate limiting and the audit trail both degrade to "treat every local
 * request as one shared IP" rather than breaking outright.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}
