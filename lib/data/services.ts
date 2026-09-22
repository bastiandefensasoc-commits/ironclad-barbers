import type { Service } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Service icons are a fixed set of six decorative badge images tied to a
 * service's slug — not business data, so they don't live in the
 * database (see the comment on Service.icon in lib/types.ts). Every
 * query below attaches the right one by slug before returning.
 */
const SERVICE_ICONS: Record<string, string> = {
  "classic-cut": "/images/icon-scissors.svg",
  "skin-fade": "/images/icon-clippers.svg",
  "beard-trim": "/images/icon-beard.svg",
  "hot-towel-shave": "/images/icon-razor.svg",
  "cut-and-beard": "/images/icon-combo.svg",
  "kids-cut": "/images/icon-kids.svg",
};

interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string;
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    durationMinutes: row.duration_minutes,
    price: row.price,
    description: row.description,
    icon: SERVICE_ICONS[row.slug] ?? "/images/icon-scissors.svg",
  };
}

export async function getAllServices(): Promise<Service[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, name, duration_minutes, price, description")
    .eq("active", true)
    .order("name");

  if (error) throw new Error(`Failed to load services: ${error.message}`);
  return (data ?? []).map(toService);
}

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, name, duration_minutes, price, description")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load service "${slug}": ${error.message}`);
  return data ? toService(data) : undefined;
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, name, duration_minutes, price, description")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load service "${id}": ${error.message}`);
  return data ? toService(data) : undefined;
}
