import { z } from "zod";

export const generateMemeSchema = z.object({
  concept: z
    .string()
    .min(3, "Concept must be at least 3 characters")
    .max(500, "Concept must be 500 characters or fewer"),
  topCaption: z.string().max(100, "Top caption too long").optional(),
  bottomCaption: z.string().max(100, "Bottom caption too long").optional(),
  communityId: z.string().optional(),
});

export type GenerateMemeInput = z.infer<typeof generateMemeSchema>;
