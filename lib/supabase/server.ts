import { createClient } from "@supabase/supabase-js";

/**
 * Every Supabase query in this app happens on the server — Server
 * Components for reads, Server Actions for writes — never a direct call
 * from the browser. Even so, which of the two clients below a given piece
 * of code reaches for is not just a style choice.
 *
 * `createPublicClient()` uses the anon key. It can do exactly what a
 * stranger with the anon key (which is embedded in the browser bundle,
 * so effectively public) could do: read active services and barbers, and
 * insert a confirmed appointment. That's genuinely all this app's public
 * pages and the booking write need — so using this client for them means
 * a coding mistake in, say, the services page can't accidentally leak
 * appointment data, because Row Level Security would block it even
 * though the code is running on a trusted server. Least privilege applied
 * to our own backend, not just to outside callers.
 *
 * `createServiceRoleClient()` uses the service role key, which bypasses
 * RLS entirely. It exists for the two operations the anon key is
 * deliberately not allowed to do: reading OTHER customers' appointments
 * to compute availability, and looking up + updating one specific
 * appointment by its cancellation token. Both are real privilege
 * escalations, reached for only where the task genuinely requires it —
 * see lib/booking/availability.ts and lib/actions/cancellation.ts.
 *
 * A fresh client is created per call rather than reused as a module-level
 * singleton, since Next.js can execute server code in different request
 * contexts and neither client holds any per-request state (no cookies,
 * no session) that would make reuse worth the added complexity.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local.");
  }

  return createClient(url, anonKey);
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check .env.local.");
  }

  // No auth session to persist or refresh — this key isn't a logged-in
  // user, it's a standing server credential.
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
