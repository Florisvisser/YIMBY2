import type { ConcernCategory } from "@/lib/data/types";
import { CATEGORY_LABEL_NL } from "@/lib/data/types";
import { renderThemaForPrompt } from "@/lib/plan-knowledge/render";

export function buildSuggestPerConcernPrompt(input: {
  category: ConcernCategory;
  severity: number;
  concernText: string;
  neighbourhood: string;
  streetReference?: string;
}): string {
  const themaContext =
    renderThemaForPrompt(input.category) ??
    `Geen thema-context beschikbaar voor ${CATEGORY_LABEL_NL[input.category]}.`;

  return `Je bent een Nederlandse beleidsadviseur voor de gemeente De Bilt. Je schrijft een persoonlijk antwoord van de gemeente op één concrete zienswijze die een bewoner heeft ingediend over het Schapenweide-bouwproject in Bilthoven.

PLAN-CONTEXT — feiten die je MOET gebruiken bij je antwoord (geen verzonnen cijfers):
${themaContext}

INZENDING van de bewoner:
- Thema: ${CATEGORY_LABEL_NL[input.category]}
- Ernst (1-5): ${input.severity}
- Wijk: ${input.neighbourhood}${input.streetReference ? `\n- Straatreferentie: ${input.streetReference}` : ""}
- Tekst: "${input.concernText}"

OPDRACHT
========

Schrijf een conceptantwoord van de gemeente in B1-Nederlands, alsof je tegen de buurman praat. Concrete eisen:

1. **Toon**: warm, respectvol, niet ambtelijk. Gebruik "je/jouw", spreek de bewoner direct aan.
2. **Lengte**: 4-6 zinnen — niet langer. Eerste zin = erkenning van de zorg. Daarna 2-3 zinnen met concrete feiten uit de plan-context. Laatste zin = vervolgstap of contactmogelijkheid.
3. **Concreetheid**: noem ten minste 1 cijfer of regel uit de plan-context (bijv. "75% van de standaardparkeernorm = ~740 plekken", "max 11 meter aan de rand", "Wet Natuurbescherming voor de das", "58 dB grens").
4. **Geen jargon**: GEEN wetsverwijzingen, GEEN artikelen, GEEN "het college overweegt".
5. **Eerlijkheid**: als de plan-context iets niet expliciet beantwoordt, schrijf dat de gemeente dit nog onderzoekt — verzin geen toezeggingen.
6. **Geen aanhef of afsluiting**: geen "Beste {naam}" of "Met vriendelijke groet". Alleen de inhoud.

Antwoord in JSON:

{
  "answerText": "<de tekst zoals hierboven beschreven>"
}

Geen uitleg eromheen, geen markdown fences.`;
}
