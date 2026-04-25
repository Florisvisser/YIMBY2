import { CATEGORY_LABEL_NL, type Concern } from "@/lib/data/types";
import { groupByCategory } from "@/lib/data/concerns";

const SCHEMA_GUIDE = `{
  "source": "claude",
  "generatedAt": "<ISO 8601 met +02:00>",
  "title": "Concept-participatieverslag Schapenweide",
  "status": "Concept — ambtelijke review vereist",
  "summary": "<2-4 zinnen, ambtelijke toon, beschrijft hoofdthema's en juridische context (Omgevingswet motiveringsplicht)>",
  "sections": [
    {
      "category": "<NL label, exact: 'Verkeer & parkeren' | 'Bouwhoogte & uitzicht' | 'Groen & natuur' | 'Geluid & leefbaarheid'>",
      "concernCount": <int, exact aantal in deze categorie>,
      "severityAverage": <number 0-5, 1 decimaal>,
      "officialMotivation": "<ambtelijke afweging, 2-4 zinnen, refereer aan wet/artikel waar passend (Omgevingswet, Bkl, Bal, Welstandsnota)>",
      "residentExplanation": "<B1-niveau Nederlands, 2-3 zinnen, geen jargon>",
      "suggestedPlanAdjustment": "<concrete stap, 1-2 zinnen>",
      "evidenceSummary": "<noem aantal reacties + gemiddelde severity + concrete kerntermen of straatnamen uit de input>",
      "reviewWarnings": ["<minstens 1 concrete kanttekening voor de ambtelijke reviewer>"]
    }
  ]
}`;

export function buildMotiveringPrompt(concerns: Concern[]): string {
  const grouped = groupByCategory(concerns);

  const blocks = (Object.keys(grouped) as Array<keyof typeof grouped>).map(
    (cat) => {
      const items = grouped[cat];
      const label = CATEGORY_LABEL_NL[cat];
      const lines = items
        .map(
          (c) =>
            `- [ernst ${c.severity}/5${c.streetReference ? `, ${c.streetReference}` : ""}, ${c.personaType}] ${c.concernText}`,
        )
        .join("\n");
      return `### ${label} (${items.length} reacties)\n${lines || "(geen reacties in deze categorie)"}`;
    },
  );

  return `Je bent een Nederlandse beleidsadviseur die een concept-participatieverslag opstelt voor het Schapenweide-bouwproject in Bilthoven (gemeente De Bilt). Het verslag moet voldoen aan de motiveringsplicht uit de Omgevingswet (artikel 16.32 Ow).

Hieronder staan ${concerns.length} reacties van bewoners, geclusterd in vier categorieën. Schrijf één participatieverslag met exact vier secties — één per categorie, in deze volgorde:
1. Verkeer & parkeren
2. Bouwhoogte & uitzicht
3. Groen & natuur
4. Geluid & leefbaarheid

Per sectie schrijf je:
- officialMotivation: ambtelijke afweging, refereer aan relevante wetsartikelen of beleidsdocumenten waar passend.
- residentExplanation: dezelfde boodschap in B1-Nederlands voor bewoners.
- suggestedPlanAdjustment: concrete vervolgstap.
- evidenceSummary: refereer expliciet aan straatnamen, kerntermen en aantallen uit de input.
- reviewWarnings: minstens één concrete kanttekening voor de ambtelijke reviewer (bv. ontbrekend onderzoek, juridisch risico).

Refereer waar passend aan: dassenburcht, Emmalaan, Nachtegaalstraat, Vinkenlaan, Soestdijkseweg, Welstandsnota Bilthoven-Centrum, Beleidsregels Parkeren Gemeente De Bilt, motiveringsplicht.

Antwoord uitsluitend met geldige JSON volgens dit schema. Geen uitleg eromheen, geen markdown code-fences:

${SCHEMA_GUIDE}

REACTIES:

${blocks.join("\n\n")}`;
}
