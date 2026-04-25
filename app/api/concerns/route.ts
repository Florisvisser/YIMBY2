import { revalidatePath } from "next/cache";
import { insertSupabaseConcern } from "@/lib/data/concerns-supabase";
import { ConcernSubmitSchema } from "@/lib/data/schema-concern";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ConcernSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const concern = await insertSupabaseConcern({
      postcode: parsed.data.postcode,
      neighbourhood: parsed.data.neighbourhood,
      street_reference: parsed.data.streetReference ?? null,
      category: parsed.data.category,
      severity: parsed.data.severity,
      concern_text: parsed.data.concernText,
      persona_type: "underrepresented_resident",
    });

    revalidatePath("/gemeente");

    return Response.json(concern, { status: 201 });
  } catch (err) {
    console.error("[/api/concerns] insert faalde:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Onbekende fout bij opslaan zienswijze.";
    return Response.json({ error: message }, { status: 500 });
  }
}
