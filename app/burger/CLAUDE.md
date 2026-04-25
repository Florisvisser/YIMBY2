# app/burger/ — Persoon B (UI)

Lees eerst `/AGENTS.md` voor project-regels. Hier staat alleen wat specifiek voor de burger-flow geldt.

## Indeling

```
app/burger/
  page.tsx        Server Component — statische intro + <BurgerForm />
  BurgerForm.tsx  "use client" — 3-stappen wizard, alle state lokaal
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

- Dubbel-klik mag nooit twee submissions afvuren → `if (submitLoading) return;` voor elke async handler.
- PDOK fail mag niet de hele flow killen — toon error inline op stap 1.
- Refresh van `/burger` reset wizard naar stap 1 (state is in-memory). Acceptabel voor demo.
