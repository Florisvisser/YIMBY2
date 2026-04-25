import { z } from "zod";

export const ConcernSubmitSchema = z.object({
  postcode: z.string().regex(/^[1-9][0-9]{3}\s?[A-Z]{2}$/, {
    message: "Postcode moet een geldige Nederlandse postcode zijn.",
  }),
  neighbourhood: z.string().min(1).max(120),
  streetReference: z.string().max(200).optional(),
  category: z.enum([
    "traffic_parking",
    "building_height",
    "green_nature",
    "noise_livability",
  ]),
  severity: z
    .number()
    .int()
    .min(1)
    .max(5),
  concernText: z.string().min(10).max(1500),
});

export type ConcernSubmitInput = z.infer<typeof ConcernSubmitSchema>;
