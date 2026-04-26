import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  readSupabaseConcernById,
  updateConcernAiSuggestion,
} from "@/lib/data/concerns-supabase";
import { buildSuggestPerConcernPrompt } from "@/lib/prompts/suggest-per-concern";
import { extractJson } from "@/lib/prompts/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 50_000;
const IdSchema = z.string().uuid();

const ResponseSchema = z.object({
  answerText: z.string().min(1).max(2000),
});

async function tryClaude(input: Parameters<typeof buildSuggestPerConcernPrompt>[0]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 600,
        messages: [{ role: "user", content: buildSuggestPerConcernPrompt(input) }],
      },
      { signal: controller.signal },
    );

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const raw = JSON.parse(extractJson(textBlock.text)) as unknown;
    return ResponseSchema.parse(raw);
  } catch (err) {
    console.warn("[suggest-answer] Claude faalde:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const concern = await readSupabaseConcernById(id);
  if (!concern) {
    return Response.json({ error: "Concern niet gevonden." }, { status: 404 });
  }

  const result = await tryClaude({
    category: concern.category,
    severity: concern.severity,
    concernText: concern.concernText,
    neighbourhood: concern.neighbourhood,
    streetReference: concern.streetReference,
  });

  if (!result) {
    return Response.json(
      { error: "AI-suggestie kon niet worden gegenereerd. Probeer opnieuw of schrijf zelf." },
      { status: 502 },
    );
  }

  try {
    await updateConcernAiSuggestion(id, result.answerText);
  } catch (err) {
    console.warn("[suggest-answer] DB-update faalde:", err);
    return Response.json(
      { error: "Suggestie gegenereerd maar niet opgeslagen." },
      { status: 500 },
    );
  }

  revalidatePath("/gemeente");
  return Response.json({ aiSuggestedAnswer: result.answerText });
}
