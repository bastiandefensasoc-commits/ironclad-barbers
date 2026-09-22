import type { Barber, WorkingHours } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/server";

interface BarberRow {
  id: string;
  slug: string;
  name: string;
  bio: string;
  specialties: string[];
  image_url: string | null;
  working_hours: WorkingHours;
  days_off: string[];
}

const SELECT_COLUMNS = "id, slug, name, bio, specialties, image_url, working_hours, days_off";

function toBarber(row: BarberRow): Barber {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    bio: row.bio,
    specialties: row.specialties,
    photo: {
      src: row.image_url ?? "/images/barber-1.svg",
      alt: `Illustrated portrait of ${row.name}`,
    },
    workingHours: row.working_hours,
    daysOff: row.days_off,
  };
}

export async function getAllBarbers(): Promise<Barber[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("barbers").select(SELECT_COLUMNS).order("name");

  if (error) throw new Error(`Failed to load barbers: ${error.message}`);
  return (data ?? []).map(toBarber);
}

export async function getBarberBySlug(slug: string): Promise<Barber | undefined> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("barbers")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load barber "${slug}": ${error.message}`);
  return data ? toBarber(data) : undefined;
}

export async function getBarberById(id: string): Promise<Barber | undefined> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("barbers").select(SELECT_COLUMNS).eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to load barber "${id}": ${error.message}`);
  return data ? toBarber(data) : undefined;
}
