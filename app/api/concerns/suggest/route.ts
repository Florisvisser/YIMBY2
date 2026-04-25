import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildSuggestPrompt } from "@/lib/prompts/suggest";
import type { ConcernCategory } from "@/lib/data/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";
const TIMEOUT_MS = 30_000;

const ConcernInputSchema = z.object({
  concernText: z.string().min(1).max(1500),
  severity: z.number().int().min(1).max(5),
  personaType: z.string().min(1),
  neighbourhood: z.string().min(1).max(120),
});

const SuggestRequestSchema = z.object({
  category: z.enum([
    "traffic_parking",
    "building_height",
    "green_nature",
    "noise_livability",
  ]),
  concerns: z.array(ConcernInputSchema).min(1).max(50),
});

const SuggestResponseSchema = z.object({
  responseAdvice: z.string().min(1),
  planAdjustment: z.string().min(1),
});

type SuggestResponse = z.infer<typeof SuggestResponseSchema>;

const FALLBACK: Record<ConcernCategory, SuggestResponse> = {
  traffic_parking: {
    responseAdvice:
      "De gemeente erkent de zorgen over verkeer en parkeren rondom het Schapenweide-project. Er wordt onderzoek gedaan naar de parkeercapaciteit en verkeersstromen op de Emmalaan en omliggende straten.",
    planAdjustment:
      "Laat een verkeerskundige studie uitvoeren voor de Emmalaan en directe omgeving voordat de bouwvergunning definitief wordt verleend.",
  },
  building_height: {
    responseAdvice:
      "De hoogte van de geplande bebouwing is een veelgehoord punt. De gemeente weegt dit zorgvuldig af tegen de woningbehoefte en de kaders uit de Welstandsnota Bilthoven-Centrum.",
    planAdjustment:
      "Onderzoek of de bouwhoogte aan de randen van het plangebied met één bouwlaag verlaagd kan worden om de overgang naar bestaande bebouwing te verbeteren.",
  },
  green_nature: {
    responseAdvice:
      "Het belang van groen en natuur in de wijk wordt serieus genomen. De gemeente bekijkt hoe compenserende beplanting en groenstroken in het ontwerp kunnen worden opgenomen.",
    planAdjustment:
      "Neem een ecologische quickscan op in de planprocedure en reserveer minimaal 15% van het plangebied voor groenvoorzieningen, inclusief aandacht voor de dassenburcht.",
  },
  noise_livability: {
    responseAdvice:
      "Geluidshinder tijdens en na de bouw is een reëel aandachtspunt. De gemeente stelt bouwtijden vast en pakt overlastmeldingen serieus op.",
    planAdjustment:
      "Stel een bouwverkeerplan op met vaste rijroutes via de Soestdijkseweg en beperk bouwactiviteiten tot werkdagen tussen 07:00 en 18:00.",
  },
};

function extractJson(text: string): string {
  const fenced = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

async function tryClaude(
  category: ConcernCategory,
  concerns: z.infer<typeof ConcernInputSchema>[],
): Promise<SuggestResponse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = new Anthropic({ apiKey });
    const prompt = buildSuggestPrompt(category, concerns);
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal },
    );

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const raw = JSON.parse(extractJson(textBlock.text)) as unknown;
    return SuggestResponseSchema.parse(raw);
  } catch (err) {
    console.warn("[suggest] Claude call faalde, fallback ingezet:", err);
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

  const parsed = SuggestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category, concerns } = parsed.data;
  const result = await tryClaude(category, concerns);
  return Response.json(result ?? FALLBACK[category]);
}
