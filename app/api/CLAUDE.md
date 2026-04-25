# app/api/ — Persoon A (Route Handlers)

Lees eerst `/AGENTS.md` en `/lib/CLAUDE.md`. Hier staat alleen route-handler-specifieke info.

## Routes (Phase 1)

| Route | Method | Body | Returns |
|---|---|---|---|
| `/api/seeded-concerns` | `GET` | — | `Concern[]` (alle 50) |
| `/api/motivering` | `POST` | `{ projectId: "schapenweide", forceFallback?: boolean }` | `MotiveringReport` |

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
