# lib/ — Persoon A (Data & API)

Lees eerst `/AGENTS.md` voor de project-regels. Hier staat alleen wat specifiek voor `lib/` geldt.

## Indeling

```
lib/
  data/
    types.ts          ConcernCategory, Concern, MotiveringReport types
    concerns-json.ts  raw read uit data/seeded-concerns.json
    concerns.ts       adapter: getConcerns(), groupByCategory(), getCategoryStats()
  motivering/
    schema.ts         zod schema voor MotiveringReport
    fallback.ts       getFallbackReport() — leest + valideert data/motivering-fallback.json
  prompts/
    motivering.ts     buildMotiveringPrompt(concerns) → string
```

## Patroon: Claude-call (`/api/motivering`)

```
1. Read concerns via lib/data/concerns.ts (niet direct JSON import)
2. Build prompt via lib/prompts/motivering.ts
3. Anthropic SDK call: model "claude-sonnet-4-6", max_tokens 4096
4. Parse JSON uit response.content[0].text
5. Validate met zod schema
6. Bij ELKE fout (missing key, timeout, parse, zod) → return getFallbackReport()
```

## Regels

- **Geen `any`.** Als TS klaagt: fix het type.
- **Geen retry** bij Claude-fout — fallback is sneller en demo-veiliger.
- **Timeout 30s** via `AbortController` + `setTimeout`. Daarna fallback.
- **Adapter discipline**: components mogen `lib/data/concerns.ts` importeren, nooit direct `data/seeded-concerns.json`.
- **Pure functies**: geen state, geen caching tussen requests.

## Severity-aggregatie

`severityAverage` in een sectie = gemiddelde van `severity` van alle concerns in die categorie, afgerond op 1 decimaal. `concernCount` = aantal concerns in die categorie.

## Anthropic SDK

Pak versie uit `package.json` (`@anthropic-ai/sdk`). Lees `node_modules/@anthropic-ai/sdk/README.md` als je de exacte API niet zeker weet. Output forceren op JSON: prompt eindigt op "Antwoord uitsluitend met geldige JSON volgens het schema. Geen uitleg, geen markdown fences."
