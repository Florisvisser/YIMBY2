import seeded from "@/data/seeded-concerns.json";
import type { Concern } from "./types";

export function readSeededConcerns(): Concern[] {
  return seeded as Concern[];
}
