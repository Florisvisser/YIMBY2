<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Samenspraak — agent regels

Dit project is een hackathon-demo. We bouwen met twee non-technical mensen via Claude Code. Volg deze regels strikt; ze voorkomen demo-falen.

## Scope (Phase 1 — demo-stabiel)

**Wel bouwen**: `/`, `/gemeente`, `/api/seeded-concerns`, `/api/motivering`, `data/seeded-concerns.json` (50 items), `data/motivering-fallback.json`.

**Niet bouwen** in Phase 1: Supabase, auth, PDOK, `/burger`, multi-language, speech, kaarten, real-time updates, developer-perspectief.

## Architectuur-regels (hard)

1. **Eén Claude-call per rapport.** Nooit `Promise.all([...])` met 4 LLM calls. Als ooit later parallel nodig: `Promise.allSettled` (nooit `Promise.all`).
2. **Fallback is JSON, niet tekst.** `data/motivering-fallback.json` heeft exact dezelfde shape als de Claude response. UI mag het verschil niet zien.
3. **Data-adapter discipline.** UI leest concerns via `lib/data/concerns.ts`. Nooit direct `import seeded from "data/seeded-concerns.json"` in een component. (Dit maakt de Phase 2 Supabase-swap triviaal.)
4. **Schema-valideer Claude output** met `zod` (`lib/motivering/schema.ts`). Bij parse/validatie-fout → fallback. Geen retry.
5. **Fallback-triggers**: missing `ANTHROPIC_API_KEY`, invalid JSON, empty response, timeout (30s), `forceFallback: true` in request body.
6. **Server Components by default.** Alleen `"use client"` voor de "Genereer verslag" knop + report rendering (interactie/state).

## Werkstijl voor Claude (lees dit hardop voor je iets vraagt)

- **Vraag Claude eerst om plan** voor niet-triviale wijzigingen. Lees het plan, vraag aanpassingen, dan pas implementeren.
- **TypeScript strict.** Als TS klaagt: laat Claude de types fixen. Nooit `any` of `// @ts-ignore` accepteren.
- **Voor commit**: `npm run lint && npm run build`. Beide groen, anders niet committen.
- **Kleine commits.** Eén logische wijziging per commit. Verwarrende commit-messages voorkomen latere ellende.
- **Geen onnodige features.** Als plan §4 zegt "niet in scope", dan niet bouwen, ook niet "snel even".

## Next.js 16 specifieke valkuilen

Voor je `app/`, `route.ts`, of metadata aanraakt: open `node_modules/next/dist/docs/` en zoek de relevante guide. Conventies wijken af van wat in Claude's training data zit (Next 13/14).

## Demo-veiligheid

- Test altijd het fallback-pad eerst (`forceFallback: true`). Als dat breekt is je demo dood.
- "Genereer verslag" knop **moet disablen on-click**. Dubbel-klik mag nooit twee Claude-calls afvuren.
- Refresh van `/gemeente` mag de pagina niet breken.

## Werkverdeling (zie ook plan-bestand)

- **Persoon A** = `lib/**`, `app/api/**`, schema, prompts, fallback-logica.
- **Persoon B** = `data/*.json`, `app/page.tsx`, `app/gemeente/page.tsx`, `app/layout.tsx`.

Raak elkaars files niet aan zonder overleg. Gedeelde files (`package.json`, `globals.css`, deze MD's) alleen tijdens gezamenlijke sessies.
