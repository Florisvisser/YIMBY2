import { z } from "zod";

export const PlanUitlegSectionSchema = z.object({
  category: z.enum([
    "traffic_parking",
    "building_height",
    "green_nature",
    "noise_livability",
  ]),
  headline: z.string().min(1),
  bodyText: z.string().min(1),
  impactLevel: z.enum(["laag", "gemiddeld", "hoog"]),
});

export const PlanUitlegReportSchema = z.object({
  intro: z.string().min(1),
  sections: z.array(PlanUitlegSectionSchema).length(4),
});
