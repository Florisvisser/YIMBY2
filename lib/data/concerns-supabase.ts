import type {
  Concern,
  ConcernCategory,
  ConcernStatus,
  PersonaType,
  Severity,
} from "./types";

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
  status: ConcernStatus;
  ai_suggested_answer: string | null;
  signed_answer: string | null;
  signed_answer_at: string | null;
  signed_answer_reference: string | null;
};

function rowToConcern(row: SupabaseConcernRow): Concern {
  return {
    id: row.id,
    projectId: row.project_id,
    source: "db",
    status: row.status,
    postcode: row.postcode,
    neighbourhood: row.neighbourhood,
    streetReference: row.street_reference ?? undefined,
    category: row.category,
    severity: row.severity as Severity,
    concernText: row.concern_text,
    personaType: row.persona_type,
    submittedAt: row.submitted_at,
    aiSuggestedAnswer: row.ai_suggested_answer ?? undefined,
    signedAnswer: row.signed_answer ?? undefined,
    signedAnswerAt: row.signed_answer_at ?? undefined,
    signedAnswerReference: row.signed_answer_reference ?? undefined,
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

export async function readSupabaseConcernsByIds(
  ids: string[],
): Promise<Concern[]> {
  const env = getEnv();
  if (!env || ids.length === 0) return [];

  const idList = ids.map(encodeURIComponent).join(",");
  const endpoint = `${env.url}/rest/v1/concerns?select=*&id=in.(${idList})`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.warn(
      `[concerns-supabase] readByIds faalde (${res.status}) — lege lijst.`,
    );
    return [];
  }

  const rows = (await res.json()) as SupabaseConcernRow[];
  return rows.map(rowToConcern);
}

export async function updateConcernStatus(
  id: string,
  status: ConcernStatus,
): Promise<Concern> {
  const env = getEnv();
  if (!env) {
    throw new Error(
      "Supabase env vars ontbreken (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_ANON_KEY).",
    );
  }

  const res = await fetch(
    `${env.url}/rest/v1/concerns?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase update faalde (${res.status}): ${text}`);
  }

  const rows = (await res.json()) as SupabaseConcernRow[];
  if (rows.length === 0) {
    throw new Error("Supabase update leverde geen rij terug — id niet gevonden?");
  }
  return rowToConcern(rows[0]);
}

export async function readSupabaseConcernById(id: string): Promise<Concern | null> {
  const env = getEnv();
  if (!env) return null;

  const endpoint = `${env.url}/rest/v1/concerns?select=*&id=eq.${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as SupabaseConcernRow[];
  return rows.length > 0 ? rowToConcern(rows[0]) : null;
}

export async function updateConcernAiSuggestion(
  id: string,
  aiSuggestedAnswer: string,
): Promise<void> {
  const env = getEnv();
  if (!env) {
    throw new Error("Supabase env vars ontbreken.");
  }

  const res = await fetch(
    `${env.url}/rest/v1/concerns?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ ai_suggested_answer: aiSuggestedAnswer }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase AI-suggestion update faalde (${res.status}): ${text}`);
  }
}

export async function signConcernAnswer(
  id: string,
  answerText: string,
  reference: string,
): Promise<Concern> {
  const env = getEnv();
  if (!env) {
    throw new Error("Supabase env vars ontbreken.");
  }

  const res = await fetch(
    `${env.url}/rest/v1/concerns?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        signed_answer: answerText,
        signed_answer_at: new Date().toISOString(),
        signed_answer_reference: reference,
        status: "answered",
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase sign-answer faalde (${res.status}): ${text}`);
  }

  const rows = (await res.json()) as SupabaseConcernRow[];
  if (rows.length === 0) {
    throw new Error("Supabase sign-answer leverde geen rij terug — id niet gevonden?");
  }
  return rowToConcern(rows[0]);
}

export async function getNextSignedAnswerReference(): Promise<string> {
  const env = getEnv();
  if (!env) return `SP-2026-${Math.random().toString().slice(2, 8)}`;

  const res = await fetch(
    `${env.url}/rest/v1/concerns?signed_answer_reference=not.is.null&select=signed_answer_reference`,
    {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Prefer: "count=exact",
      },
      cache: "no-store",
    },
  );

  const countHeader = res.headers.get("content-range");
  const count = countHeader ? parseInt(countHeader.split("/")[1] ?? "0", 10) : 0;
  const next = isNaN(count) ? 1 : count + 1;
  return `SP-A-2026-${String(next).padStart(4, "0")}`;
}

export async function insertSupabaseConcern(
  payload: Pick<
    SupabaseConcernRow,
    | "postcode"
    | "neighbourhood"
    | "street_reference"
    | "category"
    | "severity"
    | "concern_text"
    | "persona_type"
  >,
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
