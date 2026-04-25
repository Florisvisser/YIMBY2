# app/gemeente/ — Persoon B (UI)

Lees eerst `/AGENTS.md` voor project-regels. Hier staat alleen wat specifiek voor het gemeente-dashboard geldt.

## Indeling

```
app/gemeente/
  page.tsx                Server Component — laadt concerns, rendert dashboard + cards
  MotiveringPanel.tsx     "use client" — Genereer-knop + report + Onderteken & publiceer modal
  RecenteInzendingen.tsx  "use client" — filter-chips, status-mutatie knoppen, urgentie-pil op ernst
```

## Server vs Client

- `page.tsx` is **Server Component** (default). Geen `"use client"` bovenin. Roept `getConcerns()` uit `lib/data/concerns.ts` aan tijdens render.
- `MotiveringPanel.tsx` is **Client Component** (`"use client"` bovenin). Bevat `useState` voor `loading`, `report`, `error`. Bevat de `fetch("/api/motivering", { method: "POST" })` call.

## Data lezen

```ts
// page.tsx (server)
import { getConcerns, getCategoryStats } from "@/lib/data/concerns";

export default async function GemeentePage() {
  const concerns = await getConcerns();
  const stats = getCategoryStats(concerns);
  return ...
}
```

**Nooit** `import seeded from "@/data/seeded-concerns.json"` direct. Altijd via `lib/data/concerns.ts` (anders breekt Phase 2 Supabase-swap).

## Categorie-cards

Vier cards, één per categorie, elk met:
- Naam (NL): "Verkeer & parkeren", "Bouwhoogte & uitzicht", "Groen & natuur", "Geluid & leefbaarheid"
- Aantal concerns
- Gemiddelde severity (1 decimaal)
- Eén representatieve concern (kies degene met hoogste severity, of de eerste — kies en blijf consistent)

## "Genereer verslag" knop — kritisch voor demo

```ts
const [loading, setLoading] = useState(false);
const handleClick = async () => {
  if (loading) return;          // <-- voorkomt dubbel-klik
  setLoading(true);
  try {
    const res = await fetch("/api/motivering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "schapenweide" }),
    });
    const data = await res.json();
    setReport(data);
  } catch (e) {
    setError("Verslag kon niet worden gegenereerd. Probeer opnieuw.");
  } finally {
    setLoading(false);
  }
};
```

Knop: `disabled={loading}`. Tekst flipt naar "Verslag wordt gegenereerd…". Loading state moet **direct zichtbaar** zijn (binnen 100ms).

## Rapport rendering

Volg shape uit `lib/data/types.ts` (`MotiveringReport`). Vier secties, elk met:
- Categorie-titel
- Aantal + gemiddelde severity
- Officiële motivering (ambtelijke toon)
- Bewoners-uitleg (begrijpelijke taal)
- Voorgestelde plan-aanpassing
- Onderbouwing (`evidenceSummary`)
- Review-warnings (lijst, in oranje als niet-leeg)

Status-badge bovenaan: `"Concept — ambtelijke review vereist"` — vet, in oranje of geel.

## "Onderteken & publiceer" — Phase 4

Knop opent een mock modal (`role="dialog"`, `aria-modal="true"`) met:
- Subkop "OFFICIËLE PUBLICATIE"
- Tekst "Dit verslag wordt gepubliceerd als officieel participatierapport voor Schapenweide. Bewoners zien hierna het antwoord op hun zienswijze."
- Referentienummer-placeholder `SP-2026-…`
- "Annuleer" + "Bevestig & publiceer" knoppen

Op bevestig: `POST /api/reports/publish` met de huidige `report`. `useRef`-flag (`publishInFlight`) + `disabled` tijdens in-flight; bij 5xx re-enabled de knop zodat retry mogelijk is. Op success: knop wordt vervangen door "Gepubliceerd op {datum} · ref. {SP-2026-XXXX}" (moss-groen, niet-actief). De publish-route flipt server-side álle `db` concerns naar `answered`, dus refresh van `/gemeente` toont alle "Recente inzendingen" als beantwoord.

## Recente inzendingen — urgentie-pil (Phase 4)

`severityTone(severity)` in `RecenteInzendingen.tsx` mapt ernst naar kleur:
- 1–2 → moss (rustig)
- 3 → amber (aandacht)
- 4–5 → rose (urgent)

Pil staat bij de "ernst N/5"-tekst in de meta-regel; is een visueel signaal voor de scannende ambtenaar, niet semantisch leidend.

## Styling

Tailwind v4. Geen externe component library. Houd het sober en ambtelijk: neutrale kleuren, duidelijke typografie, voldoende whitespace. Demo wordt op een groot scherm gepresenteerd — leesbaarheid > schoonheid.
