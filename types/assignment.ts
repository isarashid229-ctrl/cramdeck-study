import type { AssignmentPriority } from "./database";

export type AIExtractedStep = {
  step_title: string;
  step_description: string;
  estimated_minutes: number;
  recommended_due_date: string | null;
};

export type AIExtractionResult = {
  title: string;
  course: string;
  description: string;
  due_date: string | null;
  due_date_unclear?: boolean;
  estimated_minutes: number;
  difficulty: number;
  priority: AssignmentPriority;
  requirements: string[];
  grading_weight: string;
  ai_summary: string;
  steps: AIExtractedStep[];
};

export type AssignmentInputPayload = {
  source_type: "paste" | "upload" | "manual" | "screenshot" | "pdf";
  text?: string;
  file_name?: string;
  file_type?: string;
};
