import type { MotiveringReport, PublishedReport } from "./types";

type PublishedReportRow = {
  id: string;
  project_id: "schapenweide";
  signed_at: string;
  reference: string;
  title: string;
  summary: string;
  sections: MotiveringReport["sections"];
};

function rowToReport(row: PublishedReportRow): PublishedReport {
  return {
    id: row.id,
    projectId: row.project_id,
    signedAt: row.signed_at,
    reference: row.reference,
    title: row.title,
    summary: row.summary,
    sections: row.sections,
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
    "Content-Type": "application/json",
  };
}

export async function publishReport(
  report: MotiveringReport,
): Promise<PublishedReport> {
  const env = getEnv();
  if (!env) {
    throw new Error(
      "Supabase env vars ontbreken (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_ANON_KEY).",
    );
  }

  // Get count to generate sequential reference
  const countRes = await fetch(
    `${env.url}/rest/v1/published_reports?project_id=eq.schapenweide&select=id`,
    {
      headers: { ...makeHeaders(env.key), Prefer: "count=exact" },
      cache: "no-store",
    },
  );
  const countHeader = countRes.headers.get("content-range");
  const count = countHeader ? parseInt(countHeader.split("/")[1] ?? "0", 10) : 0;
  const next = isNaN(count) ? 1 : count + 1;
  const reference = `SP-2026-${String(next).padStart(4, "0")}`;

  // Insert the report
  const insertRes = await fetch(`${env.url}/rest/v1/published_reports`, {
    method: "POST",
    headers: { ...makeHeaders(env.key), Prefer: "return=representation" },
    body: JSON.stringify({
      project_id: "schapenweide",
      reference,
      title: report.title,
      summary: report.summary,
      sections: report.sections,
    }),
    cache: "no-store",
  });

  if (!insertRes.ok) {
    const text = await insertRes.text();
    throw new Error(`Supabase insert published_reports faalde (${insertRes.status}): ${text}`);
  }

  const rows = (await insertRes.json()) as PublishedReportRow[];
  if (rows.length === 0) {
    throw new Error("Supabase insert published_reports leverde geen rij terug.");
  }
  const published = rowToReport(rows[0]);

  // Bulk-flip all db concerns in this project to 'answered'
  const [updateResult] = await Promise.allSettled([
    fetch(
      `${env.url}/rest/v1/concerns?project_id=eq.schapenweide&status=neq.answered`,
      {
        method: "PATCH",
        headers: { ...makeHeaders(env.key), Prefer: "return=minimal" },
        body: JSON.stringify({ status: "answered" }),
        cache: "no-store",
      },
    ),
  ]);

  if (updateResult.status === "rejected") {
    console.warn(
      "[published-reports] Bulk concern-status update mislukt (verslag wél gepubliceerd):",
      updateResult.reason,
    );
  } else if (!updateResult.value.ok) {
    const text = await updateResult.value.text();
    console.warn(
      `[published-reports] Bulk concern-status update faalde (${updateResult.value.status}): ${text}`,
    );
  }

  return published;
}

export async function readAllPublishedReports(
  projectId: string,
): Promise<PublishedReport[]> {
  const env = getEnv();
  if (!env) {
    console.warn(
      "[published-reports] Supabase env vars ontbreken — geen verslagen beschikbaar.",
    );
    return [];
  }

  const res = await fetch(
    `${env.url}/rest/v1/published_reports?project_id=eq.${encodeURIComponent(projectId)}&order=signed_at.desc`,
    {
      headers: makeHeaders(env.key),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    console.warn(
      `[published-reports] readAll faalde (${res.status}) — lege lijst.`,
    );
    return [];
  }

  const rows = (await res.json()) as PublishedReportRow[];
  return rows.map(rowToReport);
}

export async function readLatestPublishedReport(
  projectId: string,
): Promise<PublishedReport | null> {
  const env = getEnv();
  if (!env) {
    console.warn(
      "[published-reports] Supabase env vars ontbreken — geen gepubliceerd verslag beschikbaar.",
    );
    return null;
  }

  const res = await fetch(
    `${env.url}/rest/v1/published_reports?project_id=eq.${encodeURIComponent(projectId)}&order=signed_at.desc&limit=1`,
    {
      headers: makeHeaders(env.key),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    console.warn(
      `[published-reports] readLatest faalde (${res.status}) — geen verslag beschikbaar.`,
    );
    return null;
  }

  const rows = (await res.json()) as PublishedReportRow[];
  return rows.length > 0 ? rowToReport(rows[0]) : null;
}
