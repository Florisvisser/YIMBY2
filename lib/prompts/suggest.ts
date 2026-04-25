import { CATEGORY_LABEL_NL, type ConcernCategory } from "@/lib/data/types";

type ConcernInput = {
  concernText: string;
  severity: number;
  personaType: string;
  neighbourhood: string;
};

export function buildSuggestPrompt(
  category: ConcernCategory,
  concerns: ConcernInput[],
): string {
  const categoryLabel = CATEGORY_LABEL_NL[category];
  const lines = concerns
    .map(
      (c) =>
        `- [ernst ${c.severity}/5, ${c.neighbourhood}, ${c.personaType}] ${c.concernText}`,
    )
    .join("\n");

  return `Je bent een Nederlandse beleidsmedewerker bij gemeente De Bilt. Geef beknopt, praktisch advies voor het thema "${categoryLabel}" op basis van onderstaande ${concerns.length} bewonersreacties over het Schapenweide-bouwproject in Bilthoven.

Antwoord uitsluitend met geldige JSON in dit formaat. Geen uitleg eromheen, geen markdown code-fences:
{"responseAdvice": "<B1-niveau, 2-3 zinnen, hoe te reageren op bewoners>", "planAdjustment": "<concrete plan-aanpassing, 1-2 zinnen>"}

REACTIES:
${lines}`;
}
