import type { Concern, ConcernCategory, PersonaType, Severity } from "./types";

type SupabaseConcernRow = {
  id: string;
  project_id: "schapenweide";
  postcode: string;
  neighbourhood: string;
  street_reference: string | null;
  category: ConcernCategory;
  severity: number;
  concern_text: string;
  persona_type: PersonaType;
  submitted_at: string;
};

function rowToConcern(row: SupabaseConcernRow): Concern {
  return {
    id: row.id,
    projectId: row.project_id,
    postcode: row.postcode,
    neighbourhood: row.neighbourhood,
    streetReference: row.street_reference ?? undefined,
    category: row.category,
    severity: row.severity as Severity,
    concernText: row.concern_text,
    personaType: row.persona_type,
    submittedAt: row.submitted_at,
  };
}

function getEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export async function readSupabaseConcerns(): Promise<Concern[]> {
  const env = getEnv();
  if (!env) {
    console.warn(
      "[concerns-supabase] NEXT_PUBLIC_SUPABASE_URL of SUPABASE_ANON_KEY ontbreekt — alleen seeded data wordt gebruikt.",
    );
    return [];
  }

  const endpoint = `${env.url}/rest/v1/concerns?select=*&order=submitted_at.desc`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.warn(
      `[concerns-supabase] Supabase fetch faalde (${res.status}) — fallback naar lege lijst.`,
    );
    return [];
  }

  const rows = (await res.json()) as SupabaseConcernRow[];
  return rows.map(rowToConcern);
}

export async function insertSupabaseConcern(
  payload: Omit<SupabaseConcernRow, "id" | "project_id" | "submitted_at">,
): Promise<Concern> {
  const env = getEnv();
  if (!env) {
    throw new Error(
      "Supabase env vars ontbreken (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_ANON_KEY).",
    );
  }

  const res = await fetch(`${env.url}/rest/v1/concerns`, {
    method: "POST",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ ...payload, project_id: "schapenweide" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert faalde (${res.status}): ${text}`);
  }

  const rows = (await res.json()) as SupabaseConcernRow[];
  if (rows.length === 0) {
    throw new Error("Supabase insert leverde geen rij terug.");
  }
  return rowToConcern(rows[0]);
}
