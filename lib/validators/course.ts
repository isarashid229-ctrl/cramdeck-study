import { z } from "zod";

export const courseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(100),
  teacher: z.string().max(100).optional(),
  subject: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
});

export type CourseInput = z.infer<typeof courseSchema>;
