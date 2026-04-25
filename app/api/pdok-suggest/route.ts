import { z } from "zod";
import type { SuggestResult } from "@/lib/data/types";

export const runtime = "nodejs";

const QuerySchema = z.object({
  q: z.string().min(2).max(100),
});

type PdokSuggestDoc = {
  id?: string;
  weergavenaam?: string;
  type?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const parsed = QuerySchema.safeParse({ q });
  if (!parsed.success) return Response.json([] as SuggestResult[]);

  try {
    const params = new URLSearchParams({
      q: parsed.data.q,
      fq: "type:adres",
      fl: "id,weergavenaam,type",
      rows: "6",
    });
    const res = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?${params.toString()}`,
      { signal: AbortSignal.timeout(3000), cache: "no-store" },
    );
    if (!res.ok) return Response.json([] as SuggestResult[]);

    const data = (await res.json()) as { response?: { docs?: PdokSuggestDoc[] } };
    const docs = data?.response?.docs ?? [];

    const results: SuggestResult[] = docs
      .filter(
        (d): d is PdokSuggestDoc & { id: string; weergavenaam: string } =>
          Boolean(d.id && d.weergavenaam),
      )
      .map((d) => ({ id: d.id, label: d.weergavenaam }));

    return Response.json(results);
  } catch {
    console.warn("[pdok-suggest] PDOK call faalde — lege lijst terug.");
    return Response.json([] as SuggestResult[]);
  }
}
