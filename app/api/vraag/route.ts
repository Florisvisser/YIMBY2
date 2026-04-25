import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { z } from "zod";
import { buildVraagSystem } from "@/lib/prompts/vraag";
import type { VraagResponse } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 55_000;

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const RequestSchema = z.object({
  question: z.string().min(1).max(500),
  history: z.array(ChatMessageSchema).max(20),
  voornaam: z.string().min(1).max(100),
  straatnaam: z.string().max(200),
  postcode: z.string().max(10),
  forceFallback: z.boolean().optional(),
});

const FALLBACK_ANSWER =
  "Dat weet ik helaas niet zeker. Kijk voor meer informatie op schapenweidebilthoven.nl of bel de gemeente via 030 – 220 28 00.";

async function tryClaude(
  question: string,
  history: MessageParam[],
  voornaam: string,
  straatnaam: string,
  postcode: string,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        system: buildVraagSystem(voornaam, straatnaam, postcode),
        messages: [...history.slice(-10), { role: "user", content: question }],
      },
      { signal: controller.signal },
    );

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    return textBlock.text.trim() || null;
  } catch (err) {
    console.warn("[vraag] Claude call faalde, fallback ingezet:", err);
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

  const { question, history, voornaam, straatnaam, postcode, forceFallback } =
    parsed.data;

  if (forceFallback) {
    return Response.json({
      answer: FALLBACK_ANSWER,
      source: "fallback",
    } satisfies VraagResponse);
  }

  const answer = await tryClaude(
    question,
    history as MessageParam[],
    voornaam,
    straatnaam,
    postcode,
  );

  return Response.json({
    answer: answer ?? FALLBACK_ANSWER,
    source: answer ? "claude" : "fallback",
  } satisfies VraagResponse);
}
