import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildPlanUitlegPrompt } from "@/lib/prompts/plan-uitleg";
import { PlanUitlegReportSchema } from "@/lib/plan-uitleg/schema";
import { getFallbackPlanUitleg } from "@/lib/plan-uitleg/fallback";
import type { PlanUitlegReport } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 110_000;

const RequestSchema = z.object({
  voornaam: z.string().min(1).max(100),
  straatnaam: z.string().min(1).max(200),
  postcode: z.string().min(4).max(10),
  neighbourhood: z.string().min(1).max(120),
  forceFallback: z.boolean().optional(),
});

function extractJson(text: string): string {
  const fenced = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

async function tryClaude(
  voornaam: string,
  straatnaam: string,
  postcode: string,
): Promise<PlanUitlegReport | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new Anthropic({ apiKey });
    const prompt = buildPlanUitlegPrompt(voornaam, straatnaam, postcode);
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal },
    );

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const raw = JSON.parse(extractJson(textBlock.text)) as unknown;
    const parsed = PlanUitlegReportSchema.parse(raw);
    return {
      ...parsed,
      source: "claude",
      generatedAt: new Date().toISOString(),
    } satisfies PlanUitlegReport;
  } catch (err) {
    console.warn("[plan-uitleg] Claude call faalde, fallback ingezet:", err);
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

  const { voornaam, straatnaam, forceFallback } = parsed.data;

  if (forceFallback) {
    return Response.json(getFallbackPlanUitleg(voornaam, straatnaam));
  }

  const claudeResult = await tryClaude(
    voornaam,
    straatnaam,
    parsed.data.postcode,
  );
  return Response.json(claudeResult ?? getFallbackPlanUitleg(voornaam, straatnaam));
}
