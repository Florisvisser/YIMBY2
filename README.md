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
cp .env.example .env.local   # vul ANTHROPIC_API_KEY in (optioneel)
npm run dev
```

Open http://localhost:3000.

- Zonder `ANTHROPIC_API_KEY` werkt de app op een deterministische JSON-fallback (zelfde shape als Claude output). Demo-veilig.
- Met key: één Claude-call (Sonnet 4.6) genereert een 4-secties motivering.

## Routes

| Route | Doel |
|---|---|
| `/` | Landing |
| `/gemeente` | Dashboard voor de ambtenaar (Marieke) — Phase 1 |
| `/burger` | Burger-flow (Achmed) — Phase 2 |
| `/api/seeded-concerns` | `GET` alle 50 seeded concerns |
| `/api/motivering` | `POST` één Claude-call → concept verslag |

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

Vercel. Set `ANTHROPIC_API_KEY` als environment variable (Production + Preview).

## Build-plan

Volledige hackathon-strategie staat in `samenspraak_hackathon_build_test_plan.md`. Werkverdeling en best-practices voor AI-pair-coding staan in `AGENTS.md`.
