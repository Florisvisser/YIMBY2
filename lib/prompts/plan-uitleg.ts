const SCHAPENWEIDE_CONTEXT = `
Project: Schapenweide, Bilthoven, gemeente De Bilt
450 nieuwe woningen gepland voor 2026-2030
Postcodegebied: 3721, 3722, 3723
Straten dicht bij het plan: Emmalaan (hoofdontsluiting - druk), Nachtegaalstraat (schoolroute),
  Soestdijkseweg, Vinkenlaan, Berlagelaan, Schapenweide-weg (alternatieve ontsluiting)
Ecologie: beschermde dassenburcht (Meles meles, Wet Natuurbescherming art. 3.10) op het terrein
Bouwhoogte: plan gaat uit van max 6 lagen; bewoners willen max 4 lagen
4 thema's die bewoners raken: Verkeer & parkeren, Bouwhoogte & uitzicht, Groen & natuur, Geluid & leefbaarheid
`.trim();

const SCHEMA_GUIDE = `{
  "intro": "<2-3 zinnen, spreek {voornaam} aan met 'jij/jouw', noem de {straatnaam} als die dicht bij het plan ligt>",
  "sections": [
    {
      "category": "traffic_parking",
      "headline": "<max 8 woorden, concreet en begrijpelijk>",
      "bodyText": "<2-3 zinnen, B1-Nederlands, geen jargon, straatnaam gebruiken als relevant>",
      "impactLevel": "laag | gemiddeld | hoog"
    },
    { "category": "building_height", "headline": "...", "bodyText": "...", "impactLevel": "..." },
    { "category": "green_nature", "headline": "...", "bodyText": "...", "impactLevel": "..." },
    { "category": "noise_livability", "headline": "...", "bodyText": "...", "impactLevel": "..." }
  ]
}`;

export function buildPlanUitlegPrompt(
  voornaam: string,
  straatnaam: string,
  postcode: string,
): string {
  return `Je legt in begrijpelijke taal uit wat het Schapenweide-bouwproject betekent voor een bewoner.

Bewoner: ${voornaam}, woont aan de ${straatnaam || "onbekende straat"} (${postcode}) in Bilthoven.

Projectinformatie:
${SCHAPENWEIDE_CONTEXT}

Schrijf een korte persoonlijke intro (2-3 zinnen, spreek ${voornaam} aan met "jij/jouw"). Baseer het impactLevel per thema op de nabijheid van de ${straatnaam || "straat"} tot het plangebied en de aard van het thema. Gebruik "hoog" spaarzaam — alleen als het thema écht direct effect heeft op deze straat.

Schrijf in B1-Nederlands. Geen jargon. Geen Engelse woorden. Maximaal 3 zinnen per bodyText.

Antwoord uitsluitend met geldige JSON. Geen uitleg, geen markdown fences:

${SCHEMA_GUIDE}`;
}
