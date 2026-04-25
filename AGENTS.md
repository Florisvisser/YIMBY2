<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Samenspraak — agent regels

Dit project is een hackathon-demo. We bouwen met twee non-technical mensen via Claude Code. Volg deze regels strikt; ze voorkomen demo-falen.

## Scope

**Phase 1 (af)**: `/`, `/gemeente`, `/api/seeded-concerns`, `/api/motivering`, `data/seeded-concerns.json` (50 items), `data/motivering-fallback.json`.

**Phase 2 (af)**: `/burger` (3-stappen wizard), `/api/concerns` (POST + Supabase insert + revalidatePath), `/api/pdok` (Locatieserver proxy), Supabase `concerns` tabel, `lib/data/concerns-supabase.ts` adapter. `getConcerns()` retourneert seed ⊕ DB.

**Phase 3 (huidig)**: gescheiden burger- en gemeente-interfaces met status-loop. `Concern.source: 'seed' \| 'db'` discriminator, `Concern.status?: 'new' \| 'in_review' \| 'answered'`. Routes `PATCH /api/concerns/[id]` (status mutatie) + `POST /api/concerns/mine` (fetch by id-list). Burger-view `/burger/mijn-zorgen` met localStorage-IDs (`samenspraak.submissions.v1`). Gemeente-dashboard krijgt sectie "Recente burger-inzendingen" met filter-chips + status-knoppen + optimistic UI.

**Niet bouwen** (ook in Phase 3 niet): auth, magic links, e-mail, multi-language, speech, kaarten, realtime updates, developer-perspectief, vrije tekst-antwoorden van gemeente, Claude-gegenereerde reacties, cross-device burger-view, productie-veilige kolom-RLS.

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

- **Persoon A** = `lib/**`, `app/api/**`, schema, prompts, fallback-logica, Supabase adapter + migration.
- **Persoon B** = `data/*.json`, `app/page.tsx`, `app/gemeente/**`, `app/burger/**`, `app/layout.tsx`.

Raak elkaars files niet aan zonder overleg. Gedeelde files (`package.json`, `globals.css`, deze MD's) alleen tijdens gezamenlijke sessies.

## Env vars

| Var | Waar | Scope |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` + Vercel | Server only — Claude motiveringsverslag |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Publiek (URL zit in client bundle) |
| `SUPABASE_ANON_KEY` | `.env.local` + Vercel | Server only — publishable / anon key |

Supabase-toegang draait op de **anon key** + RLS policies: anon mag INSERT en SELECT op `concerns`, geen UPDATE/DELETE. Geen service-role key in deze app. Als Supabase env vars ontbreken: `getConcerns()` valt stil terug op alleen seeded JSON; `/api/concerns` POST faalt met 500 + duidelijke message.

## Per-map agent-instructies

Naast deze AGENTS.md staan er per werkgebied submap-`CLAUDE.md` files met specifieke regels. Claude Code laadt ze automatisch zodra je in die submap werkt:

- `lib/CLAUDE.md` — Persoon A: data-adapter (seed + Supabase) + Claude SDK patroon + status helpers
- `app/api/CLAUDE.md` — Persoon A: route handler conventies (Next 16) — `/api/motivering`, `/api/concerns`, `/api/concerns/[id]`, `/api/concerns/mine`, `/api/pdok`
- `app/gemeente/CLAUDE.md` — Persoon B: Server/Client split + dashboard regels + RecenteInzendingen
- `app/burger/CLAUDE.md` — Persoon B: 3-stappen wizard, persona-default, /mijn-zorgen view, localStorage
- `data/CLAUDE.md` — Persoon B: shape, aantallen, schrijfregels voor seeded data en fallback
