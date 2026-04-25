import fallback from "@/data/motivering-fallback.json";
import type { MotiveringReport } from "@/lib/data/types";
import { MotiveringReportSchema } from "./schema";

export function getFallbackReport(): MotiveringReport {
  const parsed = MotiveringReportSchema.parse({
    ...fallback,
    source: "fallback",
    generatedAt: new Date().toISOString(),
  });
  return parsed satisfies MotiveringReport;
}
