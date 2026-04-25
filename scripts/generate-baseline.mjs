/**
 * Run this before the hackathon to pre-generate the synthesis baseline.
 * Usage: ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-baseline.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const seededResponses = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "seeded-responses.json"), "utf-8")
);

const prompt = `You are analyzing community input for a housing development at Schapenweide, Bilthoven.
94 residents responded. Here are their design choices and optional comments:

${JSON.stringify(seededResponses, null, 2)}

Write a 3-paragraph summary for the project developer:
1. Overall sentiment (support level, key concerns)
2. The most decisive design preference and why residents chose it
3. One concrete design change that would increase support

Rules:
- Be specific. Use street names (Emmalaan, Nachtegaalstraat, Schapenweide).
- When a question shows a split of 45–55% or closer, report it as a genuine disagreement — name both perspectives and the likely reason. Do not present a split as a clear preference.
- Write as if briefing a city planner who will actually use this to modify the design.
- Keep it under 200 words.`;

const client = new Anthropic();

console.log("Calling Claude API...");

const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 400,
  messages: [{ role: "user", content: prompt }],
});

const text = message.content[0].type === "text" ? message.content[0].text : "";

const outputPath = path.join(ROOT, "data", "synthesis-baseline.txt");
fs.writeFileSync(outputPath, text, "utf-8");

console.log("Saved to data/synthesis-baseline.txt");
console.log("\n--- OUTPUT ---\n");
console.log(text);
