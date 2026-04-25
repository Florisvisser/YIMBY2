# Samenspraak

Burgerparticipatie als bewijsbare feedback-loop, niet als juridisch vinkje.

Hackathon-demo voor het Schapenweide-project (Bilthoven). De app laat zien hoe burgerzorgen geclusterd worden tot een ambtelijk concept-participatieverslag (motivering), en geeft burgers daarop terug-zicht.

## Demo loop

```
Burger dient zorg in
  → gemeente ziet geclusterd dashboard
  → "Genereer verslag" produceert concept-motivering (Claude)
  → burger ziet wat ermee gebeurt
```

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul env vars in (zie hieronder)
npm run dev
```

Open http://localhost:3000.

Env vars (zie `.env.example`):

- `ANTHROPIC_API_KEY` — optioneel. Zonder werkt de app op een deterministische JSON-fallback (zelfde shape als Claude output). Met key: één Claude-call (Sonnet 4.6) genereert een 4-secties motivering.
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ANON_KEY` — optioneel. Zonder werkt `/gemeente` met enkel de 50 seeded zienswijzen; `/burger` POST faalt netjes met een melding. Met keys: nieuwe burger-inzendingen worden persistent opgeslagen en verschijnen na refresh op `/gemeente`.

## Routes

| Route | Doel |
|---|---|
| `/` | Landing |
| `/gemeente` | Dashboard voor de ambtenaar (Marieke) — Phase 1 |
| `/burger` | Burger-flow (Achmed) — 3-stappen wizard, Phase 2 |
| `/api/seeded-concerns` | `GET` alle 50 seeded concerns |
| `/api/motivering` | `POST` één Claude-call → concept verslag |
| `/api/concerns` | `POST` zienswijze → Supabase, Phase 2 |
| `/api/pdok` | `GET` proxy naar PDOK Locatieserver, Phase 2 |

## Scripts

```bash
npm run dev       # lokaal draaien
npm run lint      # eslint
npm run build     # productie build (draai dit voor je commit)
```

## Stack

- Next.js 16 (App Router) — let op: dit is **niet** Next.js 13/14, conventies wijken af. Lees `node_modules/next/dist/docs/` voor je code wijzigt.
- React 19, TypeScript strict, Tailwind v4
- `@anthropic-ai/sdk` voor de Claude-call
- `zod` voor schema-validatie van Claude output

## Deploy

Vercel. Set deze drie environment variables (Production + Preview):

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` (publishable / anon key — server-only, niet in client bundle)

Supabase-tabel + RLS staan in `supabase/migrations/`. Toepassen via Supabase Studio SQL editor of CLI.

## Build-plan

Volledige hackathon-strategie staat in `samenspraak_hackathon_build_test_plan.md`. Werkverdeling en best-practices voor AI-pair-coding staan in `AGENTS.md`.
