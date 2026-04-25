import { revalidatePath } from "next/cache";
import { MotiveringReportSchema } from "@/lib/motivering/schema";
import { publishReport } from "@/lib/data/published-reports";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = MotiveringReportSchema.safeParse(
    (body as Record<string, unknown>)?.report,
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid report payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const published = await publishReport(parsed.data);
    revalidatePath("/gemeente");
    revalidatePath("/burger/mijn-zorgen");
    return Response.json(published);
  } catch (err) {
    console.error("[/api/reports/publish] POST faalde:", err);
    const message =
      err instanceof Error ? err.message : "Onbekende fout bij publiceren.";
    return Response.json({ error: message }, { status: 500 });
  }
}
