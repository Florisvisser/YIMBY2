import { z } from "zod";

export const ThemaAnalyseSchema = z.object({
  samenvatting: z.string().min(20).max(800),
  pijnpunten: z.array(z.string().min(8).max(400)).min(3).max(6),
  keyTakeaways: z.array(z.string().min(8).max(500)).min(2).max(4),
});

export type ThemaAnalyse = z.infer<typeof ThemaAnalyseSchema> & {
  source: "claude" | "fallback";
  generatedAt: string;
};
