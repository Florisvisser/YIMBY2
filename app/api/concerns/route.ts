import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import {
  insertSupabaseConcern,
  updateConcernAiSuggestion,
} from "@/lib/data/concerns-supabase";
import { ConcernSubmitSchema } from "@/lib/data/schema-concern";
import { buildSuggestPerConcernPrompt } from "@/lib/prompts/suggest-per-concern";
import { extractJson } from "@/lib/prompts/utils";
import type { Concern } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUGGEST_TIMEOUT_MS = 50_000;

async function fireAndForgetSuggestion(concern: Concern): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUGGEST_TIMEOUT_MS);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: buildSuggestPerConcernPrompt({
              category: concern.category,
              severity: concern.severity,
              concernText: concern.concernText,
              neighbourhood: concern.neighbourhood,
              streetReference: concern.streetReference,
            }),
          },
        ],
      },
      { signal: controller.signal },
    );

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return;

    const raw = JSON.parse(extractJson(textBlock.text)) as { answerText?: unknown };
    if (typeof raw.answerText !== "string" || raw.answerText.length < 10) return;

    await updateConcernAiSuggestion(concern.id, raw.answerText);
    revalidatePath("/gemeente");
  } catch (err) {
    console.warn("[/api/concerns] auto-suggest faalde (niet kritiek):", err);
  } finally {
    clearTimeout(timer);
  }
}

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

    // Fire-and-forget AI-suggestie genereren — return van POST mag niet wachten
    void fireAndForgetSuggestion(concern);

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
