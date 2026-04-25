import seeded from "@/data/seeded-concerns.json";
import type { Concern } from "./types";

type SeededConcern = Omit<Concern, "source" | "status">;

export function readSeededConcerns(): Concern[] {
  return (seeded as SeededConcern[]).map((item) => ({
    ...item,
    source: "seed" as const,
  }));
}
