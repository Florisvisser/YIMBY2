# app/burger/ — Persoon B (UI)

Lees eerst `/AGENTS.md` voor project-regels. Hier staat alleen wat specifiek voor de burger-flow geldt.

## Indeling

```
app/burger/
  page.tsx                       Server Component — statische intro + <BurgerForm />
  BurgerForm.tsx                 "use client" — 3-stappen wizard, alle state lokaal
  mijn-zorgen/
    page.tsx                     Server shell — header/footer, env-check, props door
    MijnZorgenList.tsx           "use client" — leest localStorage, fetch, render
```

## Server vs Client

- `page.tsx` is **Server Component**. Geen async data nodig.
- `BurgerForm.tsx` is **Client Component** (`"use client"`). Houdt alle wizard-state met `useState`. Geen URL-state, geen routes per stap.

## Wizard-stappen

State: `useState<'address' | 'concern' | 'done'>`.

1. **Adres** — postcode + huisnummer inputs → `fetch('/api/pdok?postcode=...&huisnummer=...')`. Op success → `setStep('concern')`. Op fail: foutmelding tonen, gebruiker mag opnieuw proberen.
2. **Zorg** — categorie radio-cards (4, label uit `CATEGORY_LABEL_NL`), severity 1–5 slider met NL labels, concernText textarea (min 10, max 1500 chars, live counter).
3. **Bevestig & verstuur** — submit → `fetch('/api/concerns', { method: 'POST' })`. Knop **moet disablen on-click** (zelfde patroon als `MotiveringPanel`).

## Persona

Wordt **niet** aan de burger gevraagd. Server-side default `underrepresented_resident`. Persona is een prompt-engineering construct, niet iets dat een burger snapt.

## Validatie

Client-side guards (knop disabled bij ontbrekende velden), maar de server (`/api/concerns`) doet de echte validatie via zod. Niet vertrouwen op client-state.

## Demo-veiligheid

- Dubbel-klik mag nooit twee submissions afvuren → `useRef`-flag synchroon vóór `fetch` (state-based `if (loading) return` is niet kogelvrij — twee clicks in dezelfde frame zien beide loading=false).
- PDOK fail mag niet de hele flow killen — toon error inline + "Toch doorgaan zonder PDOK-verificatie"-knop, zodat seeded-postcodes (3722 HD, etc.) die niet in PDOK staan, alsnog verder kunnen.
- Refresh van `/burger` reset wizard naar stap 1 (state is in-memory). Acceptabel voor demo.

## Mijn-zorgen (Phase 3)

Na succesvolle submit schrijft `BurgerForm.handleSubmit` het returned `id` in localStorage onder `samenspraak.submissions.v1` (array van UUIDs). De done-state link wijst naar `/burger/mijn-zorgen` — gemeente-portaal zien de burgers niet meer.

- `mijn-zorgen/page.tsx` is een **Server shell** die `process.env.NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ANON_KEY` checkt en een `supabaseConfigured` prop doorgeeft.
- `mijn-zorgen/MijnZorgenList.tsx` is **Client**. Gebruikt `useSyncExternalStore` om localStorage te lezen (geen `set-state-in-effect` lint-issue, geen hydration mismatch). POST `/api/concerns/mine` met `{ ids }` → render lijst met categorie + tekst + status-badge + datum.
- States: demo-modus banner (env mist), loading, empty (geen IDs of geen DB-rijen), error, lijst.
- **Geen mutatie-knoppen** — burger is read-only consument. Status-mutatie is gemeente-only.
