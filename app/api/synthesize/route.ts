import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const ResponseSchema = z.object({
  question_id: z.enum(["height", "ground_floor", "green_space", "entrance"]),
  chosen_option: z.enum(["A", "B"]),
  optional_comment: z.string().max(280),
});

const RequestSchema = z.object({
  seeded_count: z.number().int().min(0).max(200),
  live_responses: z.array(ResponseSchema).max(50),
});

function loadSeededResponses() {
  const filePath = path.join(process.cwd(), "data", "seeded-responses.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("Seed data missing — run the project setup first");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function buildSynthesisPrompt(allResponses: unknown[], totalCount: number) {
  return `You are analyzing community input for a housing development at Schapenweide, Bilthoven.
${totalCount} residents responded. Here are their design choices and optional comments:

${JSON.stringify(allResponses, null, 2)}

Write a 3-paragraph summary for the project developer:
1. Overall sentiment (support level, key concerns)
2. The most decisive design preference and why residents chose it
3. One concrete design change that would increase support

Rules:
- Be specific. Use street names (Emmalaan, Nachtegaalstraat, Schapenweide).
- When a question shows a split of 45–55% or closer, report it as a genuine disagreement — name both perspectives and the likely reason. Do not present a split as a clear preference.
- Write as if briefing a city planner who will actually use this to modify the design.
- Keep it under 200 words.`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify(parsed.error.issues), { status: 400 });
  }

  const { seeded_count, live_responses } = parsed.data;

  let seededResponses: unknown[];
  try {
    const all = loadSeededResponses();
    seededResponses = all.slice(0, seeded_count);
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }

  const allResponses = [...seededResponses, ...live_responses];
  const totalCount = seeded_count + live_responses.length;

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback: serve baseline synthesis
    const baselinePath = path.join(process.cwd(), "data", "synthesis-baseline.txt");
    if (fs.existsSync(baselinePath)) {
      const baseline = fs.readFileSync(baselinePath, "utf-8");
      return new Response(baseline, {
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("ANTHROPIC_API_KEY not set and no baseline found", { status: 500 });
  }

  const client = new Anthropic();
  const prompt = buildSynthesisPrompt(allResponses, totalCount);

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch {
        // Fallback to baseline on Claude timeout/error
        const baselinePath = path.join(process.cwd(), "data", "synthesis-baseline.txt");
        if (fs.existsSync(baselinePath)) {
          const baseline = fs.readFileSync(baselinePath, "utf-8");
          controller.enqueue(encoder.encode(baseline));
        }
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
