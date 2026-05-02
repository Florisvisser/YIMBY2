import type { ConcernCategory } from "./types";

// =============================================================================
// Three-sided platform: plans, plan_versions, feedback_rounds
// Read-only adapter for Deploy A. Dev-side writes come in Session 3+.
// =============================================================================

export type PlanRow = {
  id: string;
  slug: string;
  title: string;
  developer_id: string | null;
  municipality_name: string | null;
  created_at: string;
};

export type PlanVersionRow = {
  id: string;
  plan_id: string;
  version_number: number;
  knowledge: PlanKnowledge; // jsonb
  pdf_url: string | null;
  changelog: string | null;
  published_at: string | null;
  created_at: string;
};

export type FeedbackRoundRow = {
  id: string;
  plan_version_id: string;
  opens_at: string;
  closes_at: string;
  status: "open" | "closed" | "completed";
  created_at: string;
};

export type Plan = {
  id: string;
  slug: string;
  title: string;
  developerId: string | null;
  municipalityName: string | null;
  createdAt: string;
};

export type PlanVersion = {
  id: string;
  planId: string;
  versionNumber: number;
  knowledge: PlanKnowledge;
  pdfUrl: string | null;
  changelog: string | null;
  publishedAt: string | null;
  createdAt: string;
};

// PlanKnowledge mirrors the existing data/plan-knowledge.json shape.
// We keep the type loose here (Record<string, unknown>) to avoid import cycles
// with lib/plan-knowledge/render.ts. Tighten later if needed.
export type PlanKnowledge = {
  source: string;
  sourceUrl?: string;
  extractedAt?: string;
  samenvatting: string;
  ligging?: Record<string, unknown>;
  programma?: Record<string, unknown>;
  themas: Record<ConcernCategory, Record<string, unknown>>;
  cultuurhistorie?: Record<string, unknown>;
  fasering_status?: Record<string, unknown>;
  energie_klimaat?: Record<string, unknown>;
  participatie_en_proces?: Record<string, unknown>;
};

function rowToPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    developerId: row.developer_id,
    municipalityName: row.municipality_name,
    createdAt: row.created_at,
  };
}

function rowToPlanVersion(row: PlanVersionRow): PlanVersion {
  return {
    id: row.id,
    planId: row.plan_id,
    versionNumber: row.version_number,
    knowledge: row.knowledge,
    pdfUrl: row.pdf_url,
    changelog: row.changelog,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function getEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function makeHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

// -- Reads ---------------------------------------------------------------

export async function readPlanBySlug(slug: string): Promise<Plan | null> {
  const env = getEnv();
  if (!env) return null;

  const res = await fetch(
    `${env.url}/rest/v1/plans?slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { headers: makeHeaders(env.key), cache: "no-store" },
  );

  if (!res.ok) {
    console.warn(`[plans-supabase] readPlanBySlug faalde (${res.status})`);
    return null;
  }

  const rows = (await res.json()) as PlanRow[];
  return rows.length > 0 ? rowToPlan(rows[0]) : null;
}

export async function readAllPlans(): Promise<Plan[]> {
  const env = getEnv();
  if (!env) return [];

  const res = await fetch(
    `${env.url}/rest/v1/plans?select=*&order=created_at.desc`,
    { headers: makeHeaders(env.key), cache: "no-store" },
  );

  if (!res.ok) {
    console.warn(`[plans-supabase] readAllPlans faalde (${res.status})`);
    return [];
  }

  const rows = (await res.json()) as PlanRow[];
  return rows.map(rowToPlan);
}

export async function readLatestPublishedPlanVersion(
  planSlug: string,
): Promise<PlanVersion | null> {
  const env = getEnv();
  if (!env) return null;

  // Lookup plan_id by slug, then latest published version
  const planRes = await fetch(
    `${env.url}/rest/v1/plans?slug=eq.${encodeURIComponent(planSlug)}&select=id&limit=1`,
    { headers: makeHeaders(env.key), cache: "no-store" },
  );
  if (!planRes.ok) return null;
  const planRows = (await planRes.json()) as Array<{ id: string }>;
  if (planRows.length === 0) return null;
  const planId = planRows[0].id;

  const versionRes = await fetch(
    `${env.url}/rest/v1/plan_versions?plan_id=eq.${planId}&published_at=not.is.null&order=version_number.desc&limit=1`,
    { headers: makeHeaders(env.key), cache: "no-store" },
  );
  if (!versionRes.ok) return null;

  const rows = (await versionRes.json()) as PlanVersionRow[];
  return rows.length > 0 ? rowToPlanVersion(rows[0]) : null;
}

export async function readPlanKnowledge(
  planSlug: string,
): Promise<PlanKnowledge | null> {
  const version = await readLatestPublishedPlanVersion(planSlug);
  return version?.knowledge ?? null;
}
