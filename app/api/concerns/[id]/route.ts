import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateConcernStatus } from "@/lib/data/concerns-supabase";
import { StatusPatchSchema } from "@/lib/data/schema-concern";

export const runtime = "nodejs";

const IdSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = StatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await updateConcernStatus(id, parsed.data.status);
    revalidatePath("/gemeente");
    revalidatePath("/burger/mijn-zorgen");
    return Response.json(updated);
  } catch (err) {
    console.error("[/api/concerns/[id]] PATCH faalde:", err);
    const message =
      err instanceof Error ? err.message : "Onbekende fout bij status-update.";
    return Response.json({ error: message }, { status: 500 });
  }
}
