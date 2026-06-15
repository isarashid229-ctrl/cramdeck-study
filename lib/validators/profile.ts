import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  school_name: z.string().max(200).optional(),
  grade_level: z.string().max(50).optional(),
  timezone: z.string().min(1),
});

export type ProfileInput = z.infer<typeof profileSchema>;
