import { createServiceRoleClient } from "@/lib/supabase/server";

interface RateLimitConfig {
  /** A short label identifying which action this limit applies to — "booking_submit", "cancellation". */
  action: string;
  maxAttempts: number;
  windowMinutes: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMinutes?: number;
}

/**
 * Rate limiting with no external service: the state lives in the same
 * Supabase database everything else in this app already uses, not in
 * an in-memory counter. That's not a style choice — Vercel runs Server
 * Actions as stateless, horizontally-scaled functions, so an in-memory
 * `Map` would only ever see a fraction of requests for a given IP (a
 * different instance could handle the next one with no memory of the
 * last). A real INSERT the next request can actually read back is the
 * only way this works correctly in that environment.
 *
 * Counts *attempts*, not successes — the threat this defends against
 * (see lib/actions/booking.ts) is request volume itself, not
 * specifically successful bookings, so a hit is logged before the
 * caller does its real work, regardless of how that work turns out.
 */
export async function checkRateLimit(ip: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const supabase = createServiceRoleClient();
  const windowStart = new Date(Date.now() - config.windowMinutes * 60_000).toISOString();

  // Piggybacks a cheap cleanup of anything older than a day onto every
  // check, rather than needing a separate scheduled job — there are no
  // separate processes in this app by design for this phase, and at the
  // request volume a small local shop actually sees, this keeps the
  // table bounded without any extra infrastructure.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  await supabase.from("rate_limit_hits").delete().lt("created_at", dayAgo);

  const { count, error } = await supabase
    .from("rate_limit_hits")
    .select("*", { count: "exact", head: true })
    .eq("action", config.action)
    .eq("ip_address", ip)
    .gte("created_at", windowStart);

  if (error) {
    // Fails OPEN, deliberately: if this check itself can't reach the
    // database, the booking write a moment later can't either, so the
    // request fails there regardless. Treating a rate-limiter outage as
    // "block everything" would make this table a new single point of
    // failure for the whole booking flow, which is a worse trade than
    // rarely letting a few extra requests through during a genuine
    // infrastructure hiccup.
    console.error(`Rate limit check failed for "${config.action}":`, error.message);
    return { allowed: true };
  }

  if ((count ?? 0) >= config.maxAttempts) {
    return { allowed: false, retryAfterMinutes: config.windowMinutes };
  }

  const { error: insertError } = await supabase
    .from("rate_limit_hits")
    .insert({ action: config.action, ip_address: ip });
  if (insertError) {
    console.error(`Rate limit hit-logging failed for "${config.action}":`, insertError.message);
  }

  return { allowed: true };
}
