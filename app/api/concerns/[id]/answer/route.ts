import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getNextSignedAnswerReference,
  signConcernAnswer,
} from "@/lib/data/concerns-supabase";

export const runtime = "nodejs";

const IdSchema = z.string().uuid();
const BodySchema = z.object({
  answerText: z.string().min(10).max(2500),
});

export async function POST(
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const reference = await getNextSignedAnswerReference();
    const updated = await signConcernAnswer(id, parsed.data.answerText, reference);
    revalidatePath("/gemeente");
    revalidatePath("/burger/mijn-zorgen");
    return Response.json(updated);
  } catch (err) {
    console.error("[/api/concerns/[id]/answer] POST faalde:", err);
    const message =
      err instanceof Error ? err.message : "Onbekende fout bij ondertekenen.";
    return Response.json({ error: message }, { status: 500 });
  }
}
