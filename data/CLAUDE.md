# data/ — Persoon B (Content)

Lees eerst `/AGENTS.md`. Hier staat alleen wat specifiek voor de seeded data geldt.

## Bestanden

| File | Doel |
|---|---|
| `seeded-concerns.json` | Exact 50 burgerzorgen voor Schapenweide |
| `motivering-fallback.json` | Demo-veilig concept-rapport (zelfde shape als Claude output) |

## seeded-concerns.json — strikte regels

**Aantallen** (totaal 50):

| Categorie | Aantal |
|---|---|
| `traffic_parking` | 13 |
| `building_height` | 12 |
| `green_nature` | 13 |
| `noise_livability` | 12 |

**Shape per item** (zie ook `lib/data/types.ts`):

```json
{
  "id": "c-001",
  "projectId": "schapenweide",
  "postcode": "3722 HD",
  "neighbourhood": "Bilthoven",
  "streetReference": "Emmalaan",
  "category": "traffic_parking",
  "severity": 4,
  "concernText": "Met de extra woningen wordt de Emmalaan helemaal dichtgeslibd...",
  "personaType": "young_family",
  "submittedAt": "2026-04-12T09:30:00+02:00"
}
```

**Verplichte details**:

- `id`: `"c-001"` t/m `"c-050"` (lowercase, leading zero).
- `projectId`: altijd `"schapenweide"`.
- `postcode`: realistische Bilthoven-postcodes (3721, 3722, 3723).
- `neighbourhood`: `"Bilthoven"` of een wijk-naam (bv. `"Schapenweide-Noord"`).
- `streetReference`: kies uit Emmalaan, Nachtegaalstraat, Vinkenlaan, Berlagelaan, Soestdijkseweg, of laat weg.
- `severity`: integer 1–5, geen 0 of 6. Zorg voor variatie (gemiddeld rond 3).
- `personaType`: één van `young_family`, `elderly_resident`, `commuter`, `local_business`, `underrepresented_resident`. Mix gelijkmatig.
- `submittedAt`: ISO 8601 met `+02:00` (CEST). Spreid over april 2026.
- `concernText`: 1–3 zinnen, Nederlands, realistisch. Géén LLM-clichés. Refereer aan concrete plek/tijd waar mogelijk.

**Contextuele referenties die je mag gebruiken** (hackathon-plan §12):
- Emmalaan, Nachtegaalstraat (verkeer)
- dassenburcht (groen/natuur — Schapenweide-specifiek)
- verkeersdruk, motiveringsplicht
- bouwhoogte 4 lagen, schaduwwerking
- bouwlawaai, weekendrust

## motivering-fallback.json — exact zelfde shape als Claude output

```json
{
  "source": "fallback",
  "generatedAt": "2026-04-25T10:00:00+02:00",
  "title": "Concept-participatieverslag Schapenweide",
  "status": "Concept — ambtelijke review vereist",
  "summary": "...",
  "sections": [
    {
      "category": "Verkeer & parkeren",
      "concernCount": 13,
      "severityAverage": 3.8,
      "officialMotivation": "...",
      "residentExplanation": "...",
      "suggestedPlanAdjustment": "...",
      "evidenceSummary": "...",
      "reviewWarnings": ["..."]
    },
    ... 3 meer ...
  ]
}
```

**Schrijfregels voor fallback**:
- `source` is **altijd** `"fallback"` in dit bestand. De API-route overschrijft dit naar `"claude"` als Claude wel werkt.
- `status` is **letterlijk** `"Concept — ambtelijke review vereist"`. Niet vertalen, niet aanpassen.
- `officialMotivation`: ambtelijke toon, "het college overweegt", "in lijn met Omgevingswet artikel...".
- `residentExplanation`: B1-niveau Nederlands, alsof je het aan een buurman uitlegt.
- `suggestedPlanAdjustment`: concrete stap, geen wollig taalgebruik.
- `evidenceSummary`: refereer expliciet aan aantal concerns en thema's ("13 bewoners noemden de Emmalaan, gemiddelde ernst 3.8/5").
- `reviewWarnings`: minstens 1 per sectie. Voorbeelden: "Verkeerskundige doorrekening ontbreekt", "Juridisch toetsing motiveringsplicht vereist".

## Validatie

Run na elke aanpassing: `npm run build`. Als `lib/motivering/schema.ts` (Persoon A's zod schema) zijn werk doet, wordt fallback bij build/runtime gevalideerd. Als het schema klaagt, fix de JSON.
