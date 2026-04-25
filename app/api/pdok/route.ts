import { z } from "zod";

export const runtime = "nodejs";

const QuerySchema = z.object({
  postcode: z.string().regex(/^[1-9][0-9]{3}\s?[A-Z]{2}$/i),
  huisnummer: z.string().regex(/^\d{1,5}$/),
});

type PdokDoc = {
  postcode?: string;
  woonplaatsnaam?: string;
  wijknaam?: string;
  buurtnaam?: string;
  straatnaam?: string;
  huis_nlt?: string;
};

type PdokResponse = {
  response?: {
    numFound?: number;
    docs?: PdokDoc[];
  };
};

function normalizePostcode(raw: string): string {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (compact.length !== 6) return raw.toUpperCase();
  return `${compact.slice(0, 4)} ${compact.slice(4)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    postcode: url.searchParams.get("postcode") ?? "",
    huisnummer: url.searchParams.get("huisnummer") ?? "",
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Ongeldige postcode of huisnummer." },
      { status: 400 },
    );
  }

  const compactPostcode = parsed.data.postcode.replace(/\s+/g, "").toUpperCase();
  const huisnummer = parsed.data.huisnummer;

  const pdokUrl = new URL(
    "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free",
  );
  pdokUrl.searchParams.set(
    "q",
    `postcode:${compactPostcode} AND huisnummer:${huisnummer}`,
  );
  pdokUrl.searchParams.set(
    "fl",
    "postcode,woonplaatsnaam,wijknaam,buurtnaam,straatnaam,huis_nlt",
  );
  pdokUrl.searchParams.set("fq", "type:adres");
  pdokUrl.searchParams.set("rows", "1");

  let pdokRes: Response;
  try {
    pdokRes = await fetch(pdokUrl.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    console.warn("[/api/pdok] netwerkfout:", err);
    return Response.json(
      { error: "PDOK is niet bereikbaar." },
      { status: 502 },
    );
  }

  if (!pdokRes.ok) {
    return Response.json(
      { error: `PDOK gaf status ${pdokRes.status}.` },
      { status: 502 },
    );
  }

  const data = (await pdokRes.json()) as PdokResponse;
  const doc = data.response?.docs?.[0];
  if (!doc) {
    return Response.json(
      { error: "Adres niet gevonden." },
      { status: 404 },
    );
  }

  const street = [doc.straatnaam, doc.huis_nlt].filter(Boolean).join(" ");
  const neighbourhood =
    doc.buurtnaam || doc.wijknaam || doc.woonplaatsnaam || "";

  return Response.json({
    postcode: normalizePostcode(doc.postcode ?? compactPostcode),
    neighbourhood,
    streetReference: street || undefined,
  });
}
