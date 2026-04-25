import { z } from "zod";

export const MotiveringSectionSchema = z.object({
  category: z.string().min(1),
  concernCount: z.number().int().nonnegative(),
  severityAverage: z.number().min(0).max(5),
  officialMotivation: z.string().min(1),
  residentExplanation: z.string().min(1),
  suggestedPlanAdjustment: z.string().min(1),
  evidenceSummary: z.string().min(1),
  reviewWarnings: z.array(z.string()),
});

export const MotiveringReportSchema = z.object({
  source: z.enum(["claude", "fallback"]),
  generatedAt: z.string().min(1),
  title: z.string().min(1),
  status: z.literal("Concept — ambtelijke review vereist"),
  summary: z.string().min(1),
  sections: z.array(MotiveringSectionSchema).length(4),
});

export const MotiveringRequestSchema = z.object({
  projectId: z.literal("schapenweide"),
  forceFallback: z.boolean().optional(),
});

export type ParsedMotiveringReport = z.infer<typeof MotiveringReportSchema>;
