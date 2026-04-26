import {
  CATEGORY_LABEL_NL,
  type Concern,
  type ConcernCategory,
} from "@/lib/data/types";
import { groupByCategory } from "@/lib/data/concerns";
import { renderPlanKnowledgeForPrompt } from "@/lib/plan-knowledge/render";
import type { ThemaAntwoordInput } from "@/lib/motivering/schema";

const SCHEMA_GUIDE = `{
  "source": "claude",
  "generatedAt": "<ISO 8601>",
  "title": "Concept-participatieverslag Schapenweide",
  "status": "Concept — ambtelijke review vereist",
  "summary": "<2-4 zinnen, AMBTELIJKE TOON, hoofdthema's + juridische context (Omgevingswet motiveringsplicht art. 16.32 Ow)>",
  "sections": [
    {
      "category": "<NL label exact: 'Verkeer & parkeren' | 'Bouwhoogte & uitzicht' | 'Groen & natuur' | 'Geluid & leefbaarheid'>",
      "concernCount": <int>,
      "severityAverage": <number 0-5, 1 decimaal>,
      "officialMotivation": "<AMBTELIJKE afweging, 3-5 zinnen, formele toon, expliciete wets-/beleidsverwijzingen (Omgevingswet, Bbl, Bal, Wet natuurbescherming, CROW, Welstandsnota, Convenant Duurzame Woningbouw)>",
      "residentExplanation": "<B1-NEDERLANDS, 3-5 zinnen, GEEN juridisch jargon, alsof je tegen de buurman praat. Spreek de bewoner aan met 'je/jouw'. GEEN herhaling van de officialMotivation tekst — herschrijf in eenvoudige taal>",
      "suggestedPlanAdjustment": "<concrete vervolgstap, 1-2 zinnen, kan gebaseerd zijn op de planwijziging-input van de gemeente>",
      "evidenceSummary": "<aantal reacties + gemiddelde severity + 2-3 concrete kerntermen of straatnamen uit de input>",
      "reviewWarnings": ["<minstens 1 concrete kanttekening voor de ambtelijke reviewer (ontbrekend onderzoek, juridisch risico, monitoring-eis)>"]
    }
  ]
}`;

function renderConcernBlock(
  category: ConcernCategory,
  concerns: Concern[],
  antwoord: ThemaAntwoordInput | undefined,
): string {
  const label = CATEGORY_LABEL_NL[category];
  const lines = concerns
    .map(
      (c) =>
        `  - [ernst ${c.severity}/5${c.streetReference ? `, ${c.streetReference}` : ""}, ${c.personaType}] ${c.concernText}`,
    )
    .join("\n");
  const concernSection = `### ${label} (${concerns.length} reacties)\nReacties van bewoners:\n${lines || "  (geen reacties)"}`;

  if (!antwoord) return concernSection;

  const antwoordText = antwoord.antwoord.trim();
  const planwijzigingText = antwoord.planwijziging.trim();
  const inputs: string[] = [];
  if (antwoordText) {
    inputs.push(
      `Door de gemeente gevormd ANTWOORD aan bewoners (gebruik dit als startpunt — herschrijf voor zowel ambtelijk als B1):\n  "${antwoordText}"`,
    );
  }
  if (planwijzigingText) {
    inputs.push(
      `Door de gemeente voorgestelde PLANWIJZIGING (gebruik dit voor suggestedPlanAdjustment):\n  "${planwijzigingText}"`,
    );
  }
  return inputs.length > 0
    ? `${concernSection}\n${inputs.join("\n")}`
    : concernSection;
}

export function buildMotiveringPrompt(
  concerns: Concern[],
  themaAntwoorden?: ThemaAntwoordInput[],
): string {
  const grouped = groupByCategory(concerns);
  const antwoordByCategory = new Map<ConcernCategory, ThemaAntwoordInput>();
  for (const a of themaAntwoorden ?? []) antwoordByCategory.set(a.category, a);

  const blocks = (Object.keys(grouped) as ConcernCategory[]).map((cat) =>
    renderConcernBlock(cat, grouped[cat], antwoordByCategory.get(cat)),
  );

  return `Je bent een Nederlandse beleidsadviseur die een concept-participatieverslag opstelt voor het Schapenweide-bouwproject in Bilthoven (gemeente De Bilt). Het verslag moet voldoen aan de motiveringsplicht uit de Omgevingswet (artikel 16.32 Ow).

PLAN-CONTEXT (gebruik deze feiten in je motivering — geen verzonnen cijfers):
${renderPlanKnowledgeForPrompt()}

OPDRACHT
========

Schrijf één participatieverslag met EXACT VIER secties — één per categorie, in deze volgorde:
1. Verkeer & parkeren
2. Bouwhoogte & uitzicht
3. Groen & natuur
4. Geluid & leefbaarheid

KRITIEKE REGELS voor de twee tekstvelden per sectie:

📋 officialMotivation — AMBTELIJKE MOTIVERING:
  - Formele ambtelijke toon ("Het college overweegt", "in lijn met artikel ... van de Omgevingswet")
  - Expliciete wets- en beleidsverwijzingen waar passend (Omgevingswet, Bbl, Bal, Wet natuurbescherming art. 3.10 voor das, CROW-richtlijnen, Convenant Duurzame Woningbouw, Welstandsnota)
  - 3-5 zinnen
  - Geen "je/jouw" — spreek over "bewoners" of "het college"
  - Refereer aan concrete cijfers uit de plan-context (bijv. 75% CROW = ~740 plekken, 11/15/20/25m bouwhoogtes, 58 dB Wgh)

👨‍👩‍👧 residentExplanation — UITLEG VOOR BEWONERS:
  - B1-Nederlands, alsof je tegen de buurman praat
  - GEEN juridische verwijzingen (geen "artikel", "Wet ...", "Convenant")
  - Spreek de lezer aan met "je/jouw"
  - 3-5 zinnen
  - Herschrijf de inhoud volledig — kopieer GEEN zinsdelen uit de officialMotivation
  - Gebruik concrete getallen waar dat helpt ("75% van de standaardnorm", "circa 740 parkeerplekken", "max 4 lagen aan de rand")

⚠️ De twee teksten MOETEN substantieel verschillen in toon, woordkeuze en formulering. Identieke of bijna-identieke inhoud is een fout.

Per sectie schrijf je VERDER:
  - suggestedPlanAdjustment: concrete vervolgstap (1-2 zinnen). Als de gemeente een planwijziging-input heeft gegeven, gebruik die als basis.
  - evidenceSummary: refereer aan straatnamen, kerntermen en aantallen uit de bewonersreacties.
  - reviewWarnings: minstens één concrete kanttekening voor de ambtelijke reviewer (ontbrekend onderzoek, juridisch risico, monitoring-eis, e.d.).

Antwoord uitsluitend met geldige JSON volgens dit schema. Geen uitleg eromheen, geen markdown code-fences:

${SCHEMA_GUIDE}

INPUT
=====

${blocks.join("\n\n")}`;
}
