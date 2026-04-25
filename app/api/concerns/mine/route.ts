import { readSupabaseConcernsByIds } from "@/lib/data/concerns-supabase";
import { readLatestPublishedReport } from "@/lib/data/published-reports";
import { CATEGORY_LABEL_NL, type ConcernWithAnswer } from "@/lib/data/types";
import { MineSchema } from "@/lib/data/schema-concern";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = MineSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const [concernsResult, reportResult] = await Promise.allSettled([
      readSupabaseConcernsByIds(parsed.data.ids),
      readLatestPublishedReport("schapenweide"),
    ]);

    const concerns =
      concernsResult.status === "fulfilled" ? concernsResult.value : [];

    if (concernsResult.status === "rejected") {
      console.error("[/api/concerns/mine] concerns fetch faalde:", concernsResult.reason);
    }

    const report =
      reportResult.status === "fulfilled" ? reportResult.value : null;

    const enriched: ConcernWithAnswer[] = concerns.map((c) => {
      if (c.status !== "answered" || !report) return c;

      const categoryLabel = CATEGORY_LABEL_NL[c.category];
      const section = report.sections.find((s) => s.category === categoryLabel);
      if (!section) return c;

      return {
        ...c,
        verslagAnswer: section.residentExplanation,
        verslagSignedAt: report.signedAt,
        verslagReference: report.reference,
      };
    });

    return Response.json(enriched);
  } catch (err) {
    console.error("[/api/concerns/mine] fetch faalde:", err);
    return Response.json(
      { error: "Kon zienswijzen niet ophalen." },
      { status: 500 },
    );
  }
}
