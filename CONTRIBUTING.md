# Contributing

Bijdragen welkom — issues, PRs, discussies. Hieronder de engineering-principes en folder-conventies van het project.

## Setup

Zie [README](./README.md) voor `npm install` + environment variables.

## Architectuur-principes

1. **Eén Claude-call per workflow.** Geen `Promise.all([...])` met meerdere LLM calls. Als ooit parallel nodig: gebruik `Promise.allSettled` (één gefaalde call mag een ander niet killen).

2. **Statische voorbeelddata als netwerk-vangnet.** Elke route die Claude aanroept heeft een statisch JSON-fallback met dezelfde shape als de Claude-output. UI mag het verschil niet zien. Trigger-momenten: missing API key, parse-fout, schema-validatiefout, timeout (30s of 110s afhankelijk van route).

3. **Schema-valideer Claude-output met `zod`.** Bij parse- of validatiefout → fallback. Geen retry — fallback is sneller en betrouwbaarder.

4. **Data-adapter discipline.** UI leest data via `lib/data/concerns.ts`. Nooit direct `import seeded from "data/seeded-concerns.json"` in een component. Dat houdt de Supabase-laag uit zicht van de view.

5. **Server Components by default.** Alleen `"use client"` waar interactie/state nodig is (formulieren, modals, knoppen die fetch'en).

6. **Geen `any`, geen `// @ts-ignore`.** TypeScript strict; los liever het type-probleem op dan het te onderdrukken.

## Werkstijl

- **Pre-commit gate:** `npm run lint && npm run build` moeten beide groen. Geen rode commits naar main.
- **Kleine commits.** Eén logische wijziging per commit.
- **Plan eerst voor niet-triviale wijzigingen.** Schrijf even uit wat je gaat doen voor je begint — voorkomt half-werk en losse PR-pad.

## Next.js 16

Dit is **niet** Next.js 13/14. Conventies wijken af (route handlers, metadata, server actions). Voor je `app/`, `route.ts`, of metadata aanraakt: open `node_modules/next/dist/docs/` en zoek de relevante guide. Heeft AI dit niet in z'n training data? Lees de docs eerst.

## Folder-conventies

### `lib/`
Server-side helpers — data-adapters, prompts, schemas. `lib/data/concerns.ts` is de single entry voor concern-reads (combineert seeded JSON met Supabase). Pure functies, geen state of caching tussen requests.

### `app/api/`
Route handlers volgens Next 16 conventies. Altijd `export const runtime = "nodejs"` voor Anthropic SDK calls (edge runtime is onbetrouwbaar). Body-validatie via `zod`; bij parse-fout → 400. Bij Claude-fail → 200 met `source: "fallback"` payload, niet 500.

### `app/gemeente/`
Dashboard voor de gemeente. `page.tsx` is Server Component (gebruikt `getConcerns()` direct), `MotiveringPanel.tsx` + `RecenteInzendingen.tsx` zijn Client Components voor interactie. Verslag-knoppen `useRef`-flag om dubbel-klikken te voorkomen — een tweede klik mag nooit een tweede Claude-call triggeren.

### `app/burger/`
Wizard voor bewoners — alle state met `useState` in `BurgerForm.tsx`, geen URL-state per stap. PDOK fail mag niet de hele flow killen — toon error inline + "doorgaan zonder verificatie"-optie. Refresh reset wizard naar stap 1; localStorage onthoudt alleen de IDs van eerder ingediende zienswijzen.

### `data/`
JSON-bestanden zijn de waarheid voor de seeded zienswijzen, het Ontwikkelperspectief-extract, en alle voorbeelddata-shapes. Wijzigingen aan shapes vereisen ook update van het `zod`-schema in `lib/`.

## Supabase

Toegang draait op de **anon key** + RLS-policies: anon mag INSERT en SELECT op `concerns`, geen UPDATE/DELETE. Geen service-role key in deze app. Als Supabase env vars ontbreken: `getConcerns()` valt terug op alleen seeded JSON; `POST /api/concerns` faalt met een duidelijke 500-message.

Tabellen + RLS staan in `supabase/migrations/`. Toepassen via Supabase Studio SQL editor of CLI.
