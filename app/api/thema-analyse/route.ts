import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildThemaAnalysePrompt } from "@/lib/prompts/thema-analyse";
import { ThemaAnalyseSchema, type ThemaAnalyse } from "@/lib/thema-analyse/schema";
import { getFallbackThemaAnalyse } from "@/lib/thema-analyse/fallback";
import { extractJson } from "@/lib/prompts/utils";
import type { Concern, ConcernCategory } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 50_000;

const ConcernShape = z.object({
  id: z.string(),
  category: z.string(),
  severity: z.number().int().min(1).max(5),
  concernText: z.string(),
  neighbourhood: z.string(),
  streetReference: z.string().nullish(),
});

const RequestSchema = z.object({
  category: z.enum([
    "traffic_parking",
    "building_height",
    "green_nature",
    "noise_livability",
  ]),
  concerns: z.array(ConcernShape).min(1).max(60),
  forceFallback: z.boolean().optional(),
});

async function tryClaude(
  category: ConcernCategory,
  concerns: Concern[],
): Promise<ThemaAnalyse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new Anthropic({ apiKey });
    const prompt = buildThemaAnalysePrompt(category, concerns);
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal },
    );

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const raw = JSON.parse(extractJson(textBlock.text)) as unknown;
    const parsed = ThemaAnalyseSchema.parse(raw);
    return {
      ...parsed,
      source: "claude",
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[thema-analyse] Claude call faalde, fallback ingezet:", err);
    return null;
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

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category, concerns, forceFallback } = parsed.data;

  if (forceFallback) {
    return Response.json(getFallbackThemaAnalyse(category));
  }

  const claudeResult = await tryClaude(category, concerns as Concern[]);
  return Response.json(claudeResult ?? getFallbackThemaAnalyse(category));
}
