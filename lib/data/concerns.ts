import { readSeededConcerns } from "./concerns-json";
import { readSupabaseConcerns } from "./concerns-supabase";
import {
  CATEGORY_LABEL_NL,
  type CategoryStats,
  type Concern,
  type ConcernCategory,
} from "./types";

const CATEGORIES: ConcernCategory[] = [
  "traffic_parking",
  "building_height",
  "green_nature",
  "noise_livability",
];

export async function getConcerns(): Promise<Concern[]> {
  const [seeded, supabase] = await Promise.allSettled([
    readSeededConcerns(),
    readSupabaseConcerns(),
  ]);
  const seedItems = seeded.status === "fulfilled" ? seeded.value : [];
  const dbItems = supabase.status === "fulfilled" ? supabase.value : [];
  return [...seedItems, ...dbItems].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
}

export function groupByCategory(
  concerns: Concern[],
): Record<ConcernCategory, Concern[]> {
  const out: Record<ConcernCategory, Concern[]> = {
    traffic_parking: [],
    building_height: [],
    green_nature: [],
    noise_livability: [],
  };
  for (const c of concerns) {
    out[c.category].push(c);
  }
  return out;
}

function averageSeverity(items: Concern[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, c) => acc + c.severity, 0);
  return Math.round((sum / items.length) * 10) / 10;
}

function pickRepresentative(items: Concern[]): Concern | null {
  if (items.length === 0) return null;
  return [...items].sort((a, b) => b.severity - a.severity)[0];
}

export function getCategoryStats(concerns: Concern[]): CategoryStats[] {
  const grouped = groupByCategory(concerns);
  return CATEGORIES.map((category) => {
    const items = grouped[category];
    return {
      category,
      label: CATEGORY_LABEL_NL[category],
      count: items.length,
      severityAverage: averageSeverity(items),
      representative: pickRepresentative(items),
    };
  });
}
