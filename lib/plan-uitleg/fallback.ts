import fallbackJson from "@/data/plan-uitleg-fallback.json";
import type { PlanUitlegReport } from "@/lib/data/types";
import { PlanUitlegReportSchema } from "./schema";

export function getFallbackPlanUitleg(
  voornaam: string,
  straatnaam: string,
): PlanUitlegReport {
  const withTokens = {
    ...fallbackJson,
    intro: fallbackJson.intro
      .replace("{voornaam}", voornaam || "bewoner")
      .replace("{straatnaam}", straatnaam || "jouw straat"),
  };
  const parsed = PlanUitlegReportSchema.parse(withTokens);
  return {
    ...parsed,
    source: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
