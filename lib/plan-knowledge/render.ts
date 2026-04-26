import planKnowledge from "@/data/plan-knowledge.json";

type ThemaKnowledge = {
  label: string;
  feiten: string[];
  parkeernormen?: Record<string, unknown>;
  hoogtes?: Record<string, unknown>;
  groene_kamerstructuur?: Record<string, unknown>;
  water?: Record<string, unknown>;
  milieuzonering?: Record<string, unknown>;
  flankerend_beleid?: string[];
  context_bestaande_bebouwing?: string;
  verwijzingen?: string[];
};

type PlanKnowledge = typeof planKnowledge;

function flatten(value: unknown, indent = "  - "): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `${indent}${String(value)}`;
  }
  if (Array.isArray(value)) {
    return value.map((v) => flatten(v, indent)).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          return `${indent}${k}: ${String(v)}`;
        }
        return `${indent}${k}:\n${flatten(v, indent + "  ")}`;
      })
      .join("\n");
  }
  return "";
}

function renderThema(key: string, t: ThemaKnowledge): string {
  const lines: string[] = [`### ${t.label}`];
  if (t.feiten?.length) {
    lines.push("Feiten:");
    for (const f of t.feiten) lines.push(`  - ${f}`);
  }
  if (t.parkeernormen) {
    lines.push("Parkeernormen:");
    lines.push(flatten(t.parkeernormen));
  }
  if (t.hoogtes) {
    lines.push("Hoogtes:");
    lines.push(flatten(t.hoogtes));
  }
  if (t.context_bestaande_bebouwing) {
    lines.push(`Context bestaande bebouwing: ${t.context_bestaande_bebouwing}`);
  }
  if (t.groene_kamerstructuur) {
    lines.push("Groene kamerstructuur:");
    lines.push(flatten(t.groene_kamerstructuur));
  }
  if (t.water) {
    lines.push("Water:");
    lines.push(flatten(t.water));
  }
  if (t.milieuzonering) {
    lines.push("Milieuzonering:");
    lines.push(flatten(t.milieuzonering));
  }
  if (t.flankerend_beleid?.length) {
    lines.push("Flankerend beleid:");
    for (const f of t.flankerend_beleid) lines.push(`  - ${f}`);
  }
  return lines.join("\n");
}

export function renderPlanKnowledgeForPrompt(): string {
  const k = planKnowledge as PlanKnowledge;
  const lines: string[] = [];

  lines.push("Plan-overzicht (uit Ontwikkelperspectief Schapenweide, gemeente De Bilt — 29 februari 2024):");
  lines.push(k.samenvatting);
  lines.push("");
  lines.push(`Ligging: ${k.ligging.oppervlak_hectare} hectare in ${k.ligging.kern}, gemeente ${k.ligging.gemeente}.`);
  lines.push(
    `Begrenzing: noord = ${k.ligging.begrenzing.noord}; oost = ${k.ligging.begrenzing.oost}; zuid = ${k.ligging.begrenzing.zuid}; west = ${k.ligging.begrenzing.west}.`,
  );
  lines.push(
    `Postcodes: ${k.ligging.postcodegebied.join(", ")}.`,
  );
  lines.push("");
  lines.push("Programma:");
  lines.push(`  - Maximaal ${k.programma.woningen_max} woningen + ${k.programma.lifescience_max_bvo_m2} m² BVO life science.`);
  lines.push(
    `  - Woningmix: ${k.programma.woningmix.sociale_huur_pct}% sociale huur · ${k.programma.woningmix.middenhuur_pct}% middenhuur · ${k.programma.woningmix.vrije_sector_pct}% vrije sector (waarvan min. ${k.programma.woningmix.betaalbare_koop_min_pct_van_vrije_sector}% betaalbare koop tot ${k.programma.woningmix.betaalbare_koop_grens}).`,
  );
  lines.push(`  - Doelgroepen: ${k.programma.woningmix.doelgroepen_uit_woonvisie}.`);
  lines.push(`  - Verdeling: ${k.programma.woningmix.verdeling_principe}.`);
  lines.push(`  - Life science: ${k.programma.lifescience_voorwaarden}.`);
  lines.push("");
  lines.push("Vier hoofdthema's voor bewoners:");
  for (const [key, thema] of Object.entries(k.themas)) {
    lines.push("");
    lines.push(renderThema(key, thema as ThemaKnowledge));
  }
  lines.push("");
  lines.push("Cultuurhistorie:");
  for (const f of k.cultuurhistorie.feiten) lines.push(`  - ${f}`);
  lines.push("");
  lines.push("Status & fasering:");
  lines.push(`  - Datum publicatie: ${k.fasering_status.datum_publicatie}.`);
  lines.push(`  - Status: ${k.fasering_status.status}.`);
  lines.push(`  - Gemeente-ambitie tot 2030: ${k.fasering_status.gemeentelijke_woningambitie_tot_2030}.`);
  lines.push(`  - Schapenweide-aandeel: ${k.fasering_status.schapenweide_aandeel}.`);
  lines.push(`  - Beoogde bouwperiode: ${k.fasering_status.geplande_bouwperiode}.`);
  lines.push("");
  lines.push("Energie & klimaat:");
  for (const f of k.energie_klimaat.feiten) lines.push(`  - ${f}`);
  lines.push("");
  lines.push("Participatie:");
  lines.push(`  - Wettelijk niveau: ${k.participatie_en_proces.wettelijk_niveau}.`);
  lines.push(`  - Ontwikkelaar: ${k.participatie_en_proces.ontwikkelaar_verplichting}.`);
  lines.push(`  - Proces tot nu toe: ${k.participatie_en_proces.eerder_proces}.`);
  lines.push("");
  lines.push(`Bron: ${k.source}`);

  return lines.join("\n");
}

export function renderThemaForPrompt(themaKey: string): string | null {
  const k = planKnowledge as PlanKnowledge;
  const thema = (k.themas as Record<string, ThemaKnowledge>)[themaKey];
  if (!thema) return null;
  return renderThema(themaKey, thema);
}
