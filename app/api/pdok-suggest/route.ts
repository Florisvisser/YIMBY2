import { z } from "zod";
import type { SuggestResult } from "@/lib/data/types";

export const runtime = "nodejs";

const QuerySchema = z.object({
  q: z.string().min(4).max(100),
});

type PdokDoc = {
  weergavenaam?: string;
  postcode?: string;
  straatnaam?: string;
  huis_nlt?: string;
  buurtnaam?: string;
  wijknaam?: string;
  woonplaatsnaam?: string;
};

function normalizePostcode(raw: string): string {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (compact.length !== 6) return raw.toUpperCase();
  return `${compact.slice(0, 4)} ${compact.slice(4)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const parsed = QuerySchema.safeParse({ q });
  if (!parsed.success) return Response.json([] as SuggestResult[]);

  try {
    const params = new URLSearchParams({
      q: parsed.data.q,
      fq: "type:adres",
      fl: "weergavenaam,postcode,straatnaam,huis_nlt,buurtnaam,wijknaam,woonplaatsnaam",
      rows: "6",
    });
    const res = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?${params.toString()}`,
      { signal: AbortSignal.timeout(3000), cache: "no-store" },
    );
    if (!res.ok) return Response.json([] as SuggestResult[]);

    const data = (await res.json()) as { response?: { docs?: PdokDoc[] } };
    const docs = data?.response?.docs ?? [];

    const results: SuggestResult[] = docs
      .filter(
        (d): d is PdokDoc & { postcode: string; straatnaam: string } =>
          Boolean(d.postcode && d.straatnaam),
      )
      .map((d) => ({
        label:
          d.weergavenaam ??
          `${d.straatnaam} ${d.huis_nlt ?? ""}, ${normalizePostcode(d.postcode)}`.trim(),
        postcode: normalizePostcode(d.postcode),
        straatnaam: d.straatnaam,
        huis_nlt: d.huis_nlt ?? "",
        neighbourhood:
          d.buurtnaam ?? d.wijknaam ?? d.woonplaatsnaam ?? "Bilthoven",
      }));

    return Response.json(results);
  } catch {
    console.warn("[pdok-suggest] PDOK call faalde — lege lijst terug.");
    return Response.json([] as SuggestResult[]);
  }
}
