# app/api/ — Persoon A (Route Handlers)

Lees eerst `/AGENTS.md` en `/lib/CLAUDE.md`. Hier staat alleen route-handler-specifieke info.

## Routes

| Route | Method | Body / Query | Returns |
|---|---|---|---|
| `/api/seeded-concerns` | `GET` | — | `Concern[]` (seeded 50) |
| `/api/motivering` | `POST` | `{ projectId: "schapenweide", forceFallback?: boolean }` | `MotiveringReport` |
| `/api/concerns` | `POST` | `{ postcode, neighbourhood, streetReference?, category, severity (1–5), concernText }` | `201` + `Concern` |
| `/api/pdok` | `GET` | `?postcode=3722HD&huisnummer=12` | `{ postcode, neighbourhood, streetReference? }` |

**`/api/concerns`** valideert via `ConcernSubmitSchema` (`lib/data/schema-concern.ts`), inserted via service-role key, roept `revalidatePath('/gemeente')` aan zodat refresh van het dashboard de nieuwe zienswijze toont. Server vult `projectId='schapenweide'`, `personaType='underrepresented_resident'`, `submittedAt=now()`. Bij DB/env-fail: `500` + `{ error }`.

**`/api/pdok`** proxy naar `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free`. Geen API-key nodig. Bij geen match: `404`. Bij PDOK down: `502`. Normaliseert postcode terug naar `"1234 AB"` formaat.

## Next.js 16 valkuil

Dit is **niet** Next 13/14. Lees `node_modules/next/dist/docs/` (zoek op "route handler") voor de actuele signature voor `GET`/`POST` exports. Niet vertrouwen op je geheugen.

## Runtime

Voor `/api/motivering`:

```ts
export const runtime = "nodejs";
```

Niet `"edge"` — de Anthropic SDK werkt niet betrouwbaar op edge runtime.

## Response shape

Altijd `Response.json(payload, { status })`. Bij fallback:

```ts
return Response.json(report, { status: 200 });
```

Status blijft 200, ook bij fallback. Het veld `source: "fallback"` vertelt de client wat er gebeurde. Niet 500 returnen — dat breekt de UI onnodig.

## forceFallback

Als request body `{ forceFallback: true }` bevat: skip Claude, return direct `getFallbackReport()`. Handig voor demo-tests.

## Geen state tussen requests

Niets cachen in module scope. Elke request is geïsoleerd.

## Zod parsing van request body

```ts
const RequestSchema = z.object({
  projectId: z.literal("schapenweide"),
  forceFallback: z.boolean().optional(),
});
```

Bij parse-fout: return 400 met duidelijke message.
