# lib/ — Persoon A (Data & API)

Lees eerst `/AGENTS.md` voor de project-regels. Hier staat alleen wat specifiek voor `lib/` geldt.

## Indeling

```
lib/
  data/
    types.ts                ConcernCategory, Concern, ConcernStatus, ConcernWithAnswer, PublishedReport, MotiveringReport
    concerns-json.ts        raw read uit data/seeded-concerns.json — wrapt elk item met source: 'seed'
    concerns-supabase.ts    read+insert+update by REST + anon key (RLS); rowToConcern zet source: 'db'
    concerns.ts             adapter: getConcerns() (seed ⊕ DB), groupByCategory(), getCategoryStats()
    published-reports.ts    publishReport() (INSERT + bulk concern-flip naar answered) + readLatestPublishedReport()
    schema-concern.ts       zod schemas: ConcernSubmitSchema, StatusPatchSchema, MineSchema
  motivering/
    schema.ts               zod schema voor MotiveringReport (per-sectie residentExplanation = B1-uitleg)
    fallback.ts             getFallbackReport() — leest + valideert data/motivering-fallback.json
  prompts/
    motivering.ts           buildMotiveringPrompt(concerns) → string
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
- **Adapter discipline**: components mogen `lib/data/concerns.ts` importeren, nooit direct `data/seeded-concerns.json` of `concerns-supabase.ts`.
- **Pure functies**: geen state, geen caching tussen requests.

## Adapter — `getConcerns()` (Phase 2)

```ts
const [seeded, supa] = await Promise.allSettled([
  readSeededConcerns(),
  readSupabaseConcerns(),
]);
```

- Beide bronnen worden *altijd* geprobeerd. `Promise.allSettled` (nooit `Promise.all`) zodat één faalt nooit de ander killt.
- **Stille fallback** als Supabase env vars ontbreken: `readSupabaseConcerns()` retourneert `[]` met `console.warn`. Demo blijft werken op alleen seeded JSON.
- Output gesorteerd op `submittedAt` desc — nieuwste eerst (`Date.parse` delta, niet `localeCompare` — verschillende tz-suffixen).
- Snake_case → camelCase mapping gebeurt in `concerns-supabase.ts`.
- Elk item krijgt `source: 'seed' | 'db'` (Phase 3). Consumers filteren hierop voor "Recente burger-inzendingen" view.

## Phase 3 helpers

- `readSupabaseConcernsByIds(ids: string[])` — REST GET met `id=in.(uuid1,...)`. Voor `/burger/mijn-zorgen`. Lege lijst als env mist.
- `updateConcernStatus(id, status)` — REST PATCH met `Prefer: return=representation`. Throws bij fail. Server-route is gatekeeper omdat RLS UPDATE permissief is (Postgres heeft geen kolom-policies).

## Phase 4 helpers (`published-reports.ts`)

- `publishReport(report: MotiveringReport): Promise<PublishedReport>` — telt bestaande rijen, genereert reference `SP-{jaar}-{padded}`, INSERT in `published_reports`, daarna **bulk-PATCH** alle `db` concerns van project waar `status != 'answered'` → `'answered'`. Bulk-flip via `Promise.allSettled` (niet `Promise.all`) zodat een gefaalde update nooit het verslag killt; faalt stil met `console.warn`. UNIQUE-constraint op `reference` vangt race-conditions op met 409.
- `readLatestPublishedReport(projectId): Promise<PublishedReport | null>` — `order=signed_at.desc&limit=1`. Door `/api/concerns/mine` aangeroepen om elke `answered` concern te verrijken met `verslagAnswer` via categorie-match op `CATEGORY_LABEL_NL`.
- Beide gooien duidelijke errors als Supabase env-vars ontbreken (zelfde patroon als `concerns-supabase.ts`).

## Severity-aggregatie

`severityAverage` in een sectie = gemiddelde van `severity` van alle concerns in die categorie, afgerond op 1 decimaal. `concernCount` = aantal concerns in die categorie.

## Anthropic SDK

Pak versie uit `package.json` (`@anthropic-ai/sdk`). Lees `node_modules/@anthropic-ai/sdk/README.md` als je de exacte API niet zeker weet. Output forceren op JSON: prompt eindigt op "Antwoord uitsluitend met geldige JSON volgens het schema. Geen uitleg, geen markdown fences."
