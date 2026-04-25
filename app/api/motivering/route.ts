import Anthropic from "@anthropic-ai/sdk";
import { getConcerns } from "@/lib/data/concerns";
import { getFallbackReport } from "@/lib/motivering/fallback";
import { buildMotiveringPrompt } from "@/lib/prompts/motivering";
import {
  MotiveringReportSchema,
  MotiveringRequestSchema,
} from "@/lib/motivering/schema";
import type { MotiveringReport } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "claude-sonnet-4-6";

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

async function tryClaude(prompt: string): Promise<MotiveringReport | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const jsonText = extractJson(textBlock.text);
    const raw = JSON.parse(jsonText);
    const parsed = MotiveringReportSchema.parse({
      ...raw,
      source: "claude",
      generatedAt: new Date().toISOString(),
    });
    return parsed satisfies MotiveringReport;
  } catch (err) {
    console.warn("[motivering] Claude call faalde, fallback ingezet:", err);
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = MotiveringRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.forceFallback) {
    return Response.json(getFallbackReport());
  }

  const concerns = await getConcerns();
  const prompt = buildMotiveringPrompt(concerns);

  const claudeReport = await tryClaude(prompt);
  if (claudeReport) {
    return Response.json(claudeReport);
  }

  return Response.json(getFallbackReport());
}
