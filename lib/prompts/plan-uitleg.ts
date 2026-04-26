import type { ResidentLanguage } from "@/lib/data/types";
import {
  SCHAPENWEIDE_LAT,
  SCHAPENWEIDE_LON,
  haversineKm,
  bearingLabel,
} from "@/lib/geo/schapenweide";

const SCHAPENWEIDE_CONTEXT = `
Project: Schapenweide, Bilthoven, gemeente De Bilt
450 nieuwe woningen gepland voor 2026-2030
Postcodegebied: 3721, 3722, 3723
Bekende ontsluitingsstraten in de wijk: Emmalaan (hoofdontsluiting - druk), Nachtegaalstraat (schoolroute),
  Soestdijkseweg, Vinkenlaan, Berlagelaan, Schapenweide-weg (alternatieve ontsluiting)
Ecologie: beschermde dassenburcht (Meles meles, Wet Natuurbescherming art. 3.10) op het terrein
Bouwhoogte: plan gaat uit van max 6 lagen; bewoners willen max 4 lagen
4 thema's die bewoners raken: Verkeer & parkeren, Bouwhoogte & uitzicht, Groen & natuur, Geluid & leefbaarheid
`.trim();

const SCHEMA_GUIDE = `{
  "intro": "<2-3 sentences, address the resident personally, mention their street if it is near the plan area>",
  "sections": [
    {
      "category": "traffic_parking",
      "headline": "<max 8 words, concrete and accessible>",
      "bodyText": "<2-3 sentences, no jargon, mention the street when relevant>",
      "impactLevel": "laag | gemiddeld | hoog"
    },
    { "category": "building_height", "headline": "...", "bodyText": "...", "impactLevel": "..." },
    { "category": "green_nature", "headline": "...", "bodyText": "...", "impactLevel": "..." },
    { "category": "noise_livability", "headline": "...", "bodyText": "...", "impactLevel": "..." }
  ]
}`;

const OUTPUT_LANGUAGE_DIRECTIVE: Record<ResidentLanguage, string> = {
  nl: "OUTPUT TAAL: Nederlands (B1-niveau). Alle tekst-velden in het Nederlands.",
  en: "OUTPUT LANGUAGE: English (CEFR B1 level). ALL text fields (intro, headline, bodyText) MUST be written in English. Do not write any Dutch text in the output, even though the project is in the Netherlands.",
  es: "IDIOMA DE SALIDA: español (nivel CEFR B1). TODOS los campos de texto (intro, headline, bodyText) DEBEN estar en español. No escribas ningún texto en neerlandés en la salida, aunque el proyecto esté en los Países Bajos.",
};

const DIRECTION_DUTCH_PHRASE: Record<string, string> = {
  noord: "ten noorden van",
  "noord-oost": "ten noord-oosten van",
  oost: "ten oosten van",
  "zuid-oost": "ten zuid-oosten van",
  zuid: "ten zuiden van",
  "zuid-west": "ten zuid-westen van",
  west: "ten westen van",
  "noord-west": "ten noord-westen van",
};

function buildLocationLine(lat: number | undefined, lon: number | undefined): string {
  if (typeof lat !== "number" || typeof lon !== "number") return "";
  const km = haversineKm(lat, lon, SCHAPENWEIDE_LAT, SCHAPENWEIDE_LON);
  const direction = bearingLabel(SCHAPENWEIDE_LAT, SCHAPENWEIDE_LON, lat, lon);
  const phrase = DIRECTION_DUTCH_PHRASE[direction] ?? `ten ${direction} van`;
  const proximity =
    km < 0.15
      ? "direct grenzend aan het plangebied"
      : `~${km.toFixed(1)} km ${phrase} het plangebied`;
  return `Geografische positie van de woning t.o.v. het plan: ${proximity}.`;
}

export function buildPlanUitlegPrompt(
  voornaam: string,
  straatnaam: string,
  postcode: string,
  language: ResidentLanguage = "nl",
  lat?: number,
  lon?: number,
): string {
  const locationLine = buildLocationLine(lat, lon);

  return `${OUTPUT_LANGUAGE_DIRECTIVE[language]}

You explain in plain language what the Schapenweide building project means for a resident.

Resident: ${voornaam}, lives at ${straatnaam || "unknown street"} (${postcode}) in Bilthoven.
${locationLine}

Project information (in Dutch — translate the relevant facts into the output language):
${SCHAPENWEIDE_CONTEXT}

Write a short personal intro (2-3 sentences, address ${voornaam} personally and reference ${straatnaam || "their street"} when relevant). Base the impactLevel per theme on the proximity and direction of the resident's home to the plan area. Use "hoog" sparingly — only when the theme has truly direct impact on this address.

IMPORTANT — street references: Mention "Emmalaan" or "Nachtegaalstraat" ONLY if the resident's street is one of those, or directly adjacent. For residents living elsewhere, refer to their own street (${straatnaam || "their street"}) and the computed direction toward the plan, not the generic Emmalaan/Nachtegaalstraat list.

The impactLevel enum value MUST stay exactly "laag" | "gemiddeld" | "hoog" (Dutch keys — these are machine-readable, do not translate). All other text fields (intro, headline, bodyText) MUST be in the output language declared above.

Respond with valid JSON only. No explanation, no markdown fences:

${SCHEMA_GUIDE}

REMINDER: ${OUTPUT_LANGUAGE_DIRECTIVE[language]}`;
}
