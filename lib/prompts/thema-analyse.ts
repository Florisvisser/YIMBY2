import type { Concern, ConcernCategory } from "@/lib/data/types";
import { CATEGORY_LABEL_NL } from "@/lib/data/types";

const SCHEMA_GUIDE = `{
  "samenvatting": "<2-3 zinnen, B1-Nederlands, geeft de kern weer van wat bewoners in dit thema raakt>",
  "pijnpunten": [
    "<concrete pijn die meerdere bewoners noemen, max 1 zin>",
    "<volgende pijnpunt>",
    "<3-5 stuks totaal, gesorteerd op urgentie>"
  ],
  "keyTakeaways": [
    "<actiegerichte conclusie voor de ambtenaar — wat MOET de gemeente afwegen>",
    "<2-4 stuks totaal>"
  ]
}`;

export function buildThemaAnalysePrompt(
  category: ConcernCategory,
  concerns: Concern[],
): string {
  const label = CATEGORY_LABEL_NL[category];
  const concernsList = concerns
    .map(
      (c, i) =>
        `${i + 1}. [ernst ${c.severity}/5${c.streetReference ? `, ${c.streetReference}` : ""}, ${c.neighbourhood}] ${c.concernText}`,
    )
    .join("\n");

  return `Je analyseert ingediende zienswijzen voor een ambtenaar Ruimtelijke Ordening van gemeente De Bilt. Project: Schapenweide-bouwproject in Bilthoven (450 nieuwe woningen, 2026-2030).

Thema: ${label}
Aantal zienswijzen in dit thema: ${concerns.length}

Hieronder staan alle zienswijzen letterlijk. Lees ze door en distilleer:
- Een korte samenvatting (2-3 zinnen) van wat bewoners in dit thema het meeste raakt
- 3-5 concrete pijnpunten — specifieke pijnen die meerdere bewoners noemen (geen abstracties)
- 2-4 key takeaways — actiegerichte afwegingen voor de gemeente, in ambtelijke maar heldere taal

Gebruik B1-Nederlands voor samenvatting en pijnpunten (geen jargon, geen Engels). Voor takeaways mag het iets formeler zijn, maar nog steeds concreet en bruikbaar.

Zienswijzen:
${concernsList}

Antwoord uitsluitend met geldige JSON. Geen uitleg, geen markdown fences:

${SCHEMA_GUIDE}`;
}
