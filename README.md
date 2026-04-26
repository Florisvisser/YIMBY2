# Samenspraak

Burgerparticipatie die voor bewoners werkt — én bewijsbaar landt bij de gemeente.

[→ samenspraak.vercel.app](https://samenspraak.vercel.app)

Samenspraak is een open-source participatieplatform voor Nederlandse omgevingsvragen. Bewoners schrijven in begrijpelijke taal hun zorgen over een bouwplan in hun buurt. Een AI-laag clustert vergelijkbare zorgen, helpt de gemeente met onderbouwde antwoorden, en geeft elke indiener een ondertekend antwoord terug — geen formulier dat verdwijnt in een lade.

De live-versie draait rond het **Schapenweide-bouwplan** in Bilthoven (gemeente De Bilt) — 450 woningen plus 25.000 m² life science op een terrein van 12 hectare.

## Hoe het werkt

```
Bewoner schrijft zorg op /burger
  → AI legt het plan uit voor het exacte adres (afstand + windrichting)
  → Onbeperkt vragen aan de chat (gevoed met het officiële Ontwikkelperspectief)
  → Zienswijze ingediend met thema + ernst
  → Gemeente ziet de zorg op /gemeente met een AI-conceptantwoord erbij
  → Gemeente bewerkt + ondertekent + verstuurt
  → Bewoner ziet het persoonlijke antwoord op /burger/mijn-zorgen
  → De vier thema-antwoorden samen worden ook als ondertekend verslag gepubliceerd
```

## Functies

**Voor bewoners**
- Plan uitgelegd in B1-Nederlands voor jouw exacte adres
- Onbeperkt vragen stellen aan een chat die het officiële Ontwikkelperspectief kent
- Spraak-naar-tekst voor wie liever inspreekt
- Volg jouw zorg tot het ondertekende antwoord
- Inzicht in eerder gepubliceerde verslagen en officiële stukken

**Voor gemeentes**
- Honderden zorgen automatisch geclusterd in vier thema's
- Per zorg een AI-conceptantwoord op basis van de planfeiten
- Bewerken + ondertekenen + versturen in één flow
- Concept-eindverslag binnen 30 seconden, klaar voor controle
- Eén klik publiceren — alle indieners krijgen automatisch antwoord

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul environment variables in (zie hieronder)
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Verplicht? | Functie |
|---|---|---|
| `ANTHROPIC_API_KEY` | Aanbevolen | Voedt plan-uitleg, chat, AI-conceptantwoorden en het concept-verslag. Zonder key werkt de app op statische voorbeelddata met dezelfde structuur, zodat je de UI lokaal kunt verkennen. |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ANON_KEY` | Aanbevolen | Persistent opslaan van zienswijzen en gepubliceerde verslagen. Zonder Supabase toont `/gemeente` alleen de 50 voorbeeld-zienswijzen. |
| `REASON8_API_KEY` | Optioneel | Schakelt de microfoon-knop in voor spraak-naar-tekst via Reson8. Typen werkt altijd. |

### Scripts

```bash
npm run dev       # lokaal draaien
npm run lint      # eslint
npm run build     # productie build
```

## Routes

### Pagina's

| Route | Doel |
|---|---|
| `/` | Landing met persona-keuze (bewoner / gemeente) |
| `/gemeente` | Dashboard voor de gemeente — thema's, recente zienswijzen, verslag-publicatie |
| `/burger` | Bewoners-flow — adresinvoer, plan-uitleg, chat, zienswijze indienen |
| `/burger/mijn-zorgen` | Eigen ingediende zienswijzen + ondertekende antwoorden |

### API

| Route | Methode | Doel |
|---|---|---|
| `/api/concerns` | `POST` | Zienswijze opslaan + AI-antwoordsuggestie triggeren |
| `/api/concerns/[id]` | `PATCH` | Status muteren (`new` / `in_review` / `answered`) |
| `/api/concerns/[id]/answer` | `POST` | Gemeente ondertekent + verstuurt antwoord op één zorg |
| `/api/concerns/[id]/suggest-answer` | `POST` | Handmatig AI-suggestie regenereren |
| `/api/concerns/mine` | `POST` | Eigen zienswijzen, verrijkt met antwoord |
| `/api/concerns/suggest` | `POST` | AI-antwoordsuggestie op cluster-niveau |
| `/api/motivering` | `POST` | Concept-participatieverslag genereren (4 secties) |
| `/api/plan-uitleg` | `POST` | Plan-uitleg op maat van het adres (afstand, windrichting) |
| `/api/vraag` | `POST` | Chat-antwoord op een vraag over het plan |
| `/api/thema-analyse` | `POST` | AI-pijnpuntenanalyse per thema |
| `/api/reports/publish` | `POST` | Verslag ondertekenen en publiceren |
| `/api/reson8` | `POST` | Spraak-naar-tekst proxy (audio-blob → transcript) |
| `/api/pdok` · `/api/pdok-suggest` · `/api/pdok-lookup` | `GET` | PDOK Locatieserver-proxy voor adresresolutie |
| `/api/seeded-concerns` | `GET` | Voorbeeld-zienswijzen (read-only) |

## Architectuur

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict** · **Tailwind v4**
- **Anthropic Claude** (Sonnet 4.6) — één call per workflow, output gevalideerd met `zod`, met statische voorbeelddata als netwerk-vangnet zodat de UI altijd blijft werken
- **Supabase** (Postgres + RLS) voor persistentie
- **PDOK Locatieserver** voor adres-autocomplete
- **Leaflet** voor de plan-locatiekaart
- **Reson8** voor spraak-naar-tekst (optioneel)

Alle plan-feiten (parkeernormen, bouwhoogtes, ecologie, geluid, programma) zijn uit de officiële PDF geëxtraheerd naar `data/plan-knowledge.json` en functioneren als single source of truth voor zowel de chat, de plan-uitleg als de gemeente-verslagen.

## Bron-data

> **Ontwikkelperspectief Schapenweide** — gemeente De Bilt, 29 februari 2024
> [Officiële PDF](https://www.debilt.nl/fileadmin/bestanden/Over_De_Bilt/Projecten/Schapenweide/Ontwikkelperspectief_Schapenweide.pdf)

Geen persoonsgegevens worden opgeslagen — alleen postcode, wijk, een straatreferentie, de gekozen categorie en de tekst van de zienswijze.

## Deploy

Vercel. Set deze environment variables (Production + Preview):

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` (publishable / anon key — server-only, niet in client bundle)
- `REASON8_API_KEY` (optioneel)

Supabase-tabellen + RLS-policies staan in `supabase/migrations/`. Toepassen via Supabase Studio SQL editor of CLI.
