import { z } from "zod";
import type { SuggestResult } from "@/lib/data/types";

export const runtime = "nodejs";

const QuerySchema = z.object({
  id: z.string().regex(/^adr-[a-f0-9]{32}$/i),
});

type PdokLookupDoc = {
  weergavenaam?: string;
  postcode?: string;
  straatnaam?: string;
  huis_nlt?: string;
  buurtnaam?: string;
  wijknaam?: string;
  woonplaatsnaam?: string;
  centroide_ll?: string;
};

function parseCentroide(raw?: string): { lat: number; lon: number } | null {
  if (!raw) return null;
  const m = raw.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!m) return null;
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

function normalizePostcode(raw: string): string {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (compact.length !== 6) return raw.toUpperCase();
  return `${compact.slice(0, 4)} ${compact.slice(4)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";

  const parsed = QuerySchema.safeParse({ id });
  if (!parsed.success) {
    return Response.json({ error: "Ongeldige id." }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      id: parsed.data.id,
      fl: "weergavenaam,postcode,straatnaam,huis_nlt,buurtnaam,wijknaam,woonplaatsnaam,centroide_ll",
    });
    const res = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?${params.toString()}`,
      { signal: AbortSignal.timeout(3000), cache: "no-store" },
    );
    if (!res.ok) {
      return Response.json({ error: "PDOK lookup mislukt." }, { status: 502 });
    }

    const data = (await res.json()) as { response?: { docs?: PdokLookupDoc[] } };
    const doc = data?.response?.docs?.[0];
    if (!doc?.postcode || !doc?.straatnaam) {
      return Response.json({ error: "Adres niet gevonden." }, { status: 404 });
    }

    const coord = parseCentroide(doc.centroide_ll);
    const result: SuggestResult = {
      id: parsed.data.id,
      label:
        doc.weergavenaam ??
        `${doc.straatnaam} ${doc.huis_nlt ?? ""}, ${normalizePostcode(doc.postcode)}`.trim(),
      postcode: normalizePostcode(doc.postcode),
      straatnaam: doc.straatnaam,
      huis_nlt: doc.huis_nlt ?? "",
      neighbourhood: doc.buurtnaam ?? doc.wijknaam ?? doc.woonplaatsnaam ?? "Bilthoven",
      lat: coord?.lat,
      lon: coord?.lon,
    };

    return Response.json(result);
  } catch {
    console.warn("[pdok-lookup] PDOK call faalde.");
    return Response.json({ error: "PDOK niet beschikbaar." }, { status: 503 });
  }
}
