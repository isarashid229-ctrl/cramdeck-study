import { z } from "zod";

export const assignmentInputSchema = z.object({
  source_type: z.enum(["paste", "upload", "manual", "screenshot", "pdf"]),
  text: z.string().max(50000).optional(),
  file_name: z.string().optional(),
  file_type: z.string().optional(),
});

export const aiStepSchema = z.object({
  step_title: z.string(),
  step_description: z.string(),
  estimated_minutes: z.number().int().min(0),
  recommended_due_date: z.string().nullable(),
});

export const aiExtractionSchema = z.object({
  title: z.string().min(1),
  course: z.string(),
  description: z.string(),
  due_date: z.string().nullable(),
  due_date_unclear: z.boolean().optional(),
  estimated_minutes: z.number().int().min(0),
  difficulty: z.number().int().min(1).max(5),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  requirements: z.array(z.string()),
  grading_weight: z.string(),
  ai_summary: z.string(),
  steps: z.array(aiStepSchema).min(1).max(10),
});

export const assignmentReviewSchema = z.object({
  title: z.string().min(1, "Title is required"),
  course_id: z.string().uuid().optional().nullable(),
  course_name: z.string().optional(),
  description: z.string(),
  notes: z.string().optional(),
  due_date: z.string().nullable(),
  estimated_minutes: z.coerce.number().int().min(5),
  difficulty: z.coerce.number().int().min(1).max(5),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  requirements: z.array(z.string()),
  grading_weight: z.string(),
  ai_summary: z.string(),
  source_type: z.string(),
  original_input: z.string().optional(),
  file_url: z.string().optional().nullable(),
  steps: z.array(
    z.object({
      step_title: z.string().min(1),
      step_description: z.string(),
      estimated_minutes: z.coerce.number().int().min(5),
      recommended_due_date: z.string().nullable(),
    })
  ),
});

export type AssignmentReviewInput = z.infer<typeof assignmentReviewSchema>;
