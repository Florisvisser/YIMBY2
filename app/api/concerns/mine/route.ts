import { readSupabaseConcernsByIds } from "@/lib/data/concerns-supabase";
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
    const concerns = await readSupabaseConcernsByIds(parsed.data.ids);
    return Response.json(concerns);
  } catch (err) {
    console.error("[/api/concerns/mine] fetch faalde:", err);
    return Response.json(
      { error: "Kon zienswijzen niet ophalen." },
      { status: 500 },
    );
  }
}
