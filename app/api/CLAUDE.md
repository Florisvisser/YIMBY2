# app/api/ — Persoon A (Route Handlers)

Lees eerst `/AGENTS.md` en `/lib/CLAUDE.md`. Hier staat alleen route-handler-specifieke info.

## Routes

| Route | Method | Body / Query | Returns |
|---|---|---|---|
| `/api/seeded-concerns` | `GET` | — | `Concern[]` (seeded 50) |
| `/api/motivering` | `POST` | `{ projectId: "schapenweide", forceFallback?: boolean }` | `MotiveringReport` |
| `/api/concerns` | `POST` | `{ postcode, neighbourhood, streetReference?, category, severity (1–5), concernText }` | `201` + `Concern` |
| `/api/concerns/[id]` | `PATCH` | `{ status: "new" \| "in_review" \| "answered" }` | `200` + updated `Concern` |
| `/api/concerns/mine` | `POST` | `{ ids: uuid[] }` (max 50) | `Concern[]` |
| `/api/pdok` | `GET` | `?postcode=3722HD&huisnummer=12` | `{ postcode, neighbourhood, streetReference? }` |

**`/api/concerns`** valideert via `ConcernSubmitSchema`, inserted via anon key (RLS), roept `revalidatePath('/gemeente')` aan. Server vult `projectId='schapenweide'`, `personaType='underrepresented_resident'`, `submittedAt=now()`. Bij DB/env-fail: `500` + `{ error }`.

**`/api/concerns/[id]` PATCH** (Phase 3) — status-mutatie door gemeente. Valideert UUID + `StatusPatchSchema`. Server is de gatekeeper: alleen status wordt doorgegeven aan `updateConcernStatus`, andere kolommen blijven onaangetast (RLS UPDATE policy is permissief omdat Postgres geen kolom-policies kent). `revalidatePath('/gemeente')` én `revalidatePath('/burger/mijn-zorgen')`.

**`/api/concerns/mine` POST** (Phase 3) — fetch by id-list voor `/burger/mijn-zorgen`. Body `{ ids: uuid[] }`, max 50, `MineSchema`. POST i.p.v. GET om URL-lengtelimiet te vermijden bij vele submissions en schoner in proxy/CDN logs.

**`/api/pdok`** proxy naar Locatieserver. Geen API-key nodig. Bij geen match: `404`. Bij PDOK down/timeout: `502`/`504`. `AbortSignal.timeout(5000)` op de fetch. Normaliseert postcode terug naar `"1234 AB"` formaat.

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
