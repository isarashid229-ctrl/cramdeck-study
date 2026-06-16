import type { AIExtractionResult } from "@/types/assignment";
import { computePriority } from "@/lib/utils";
import { cleanAssignmentTitle, estimateMinutesFromText, summarizeAssignmentText } from "@/lib/assignments/presentation";

export function fallbackAssignmentExtraction(text: string): AIExtractionResult {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const titleMatch =
    text.match(/^(?:title|assignment|homework|task)\s*:\s*(.+)$/im) ||
    text.match(/^[A-Za-z .'-]{2,30}\s+(?:assignment|homework|project|essay|lab|quiz|test|review)\s*:\s*(.+)$/im);
  const courseMatch = cleaned.match(/(?:course|class)\s*:\s*([^.\n]+)/i);
  const dueMatch = cleaned.match(/(?:due|deadline)\s*:?\s*([A-Za-z]+\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  const title = cleanAssignmentTitle(titleMatch?.[1] || cleaned);
  const estimatedMinutes = estimateMinutesFromText(cleaned);
  const difficulty = cleaned.length > 1200 ? 4 : cleaned.length > 500 ? 3 : 2;
  const dueDate = dueMatch?.[1] ? new Date(dueMatch[1]) : null;
  const normalizedDueDate = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null;
  const priority = computePriority(normalizedDueDate, difficulty, estimatedMinutes);

  return {
    title,
    course: cleanAssignmentTitle(courseMatch?.[1] || ""),
    description: summarizeAssignmentText(cleaned),
    due_date: normalizedDueDate,
    due_date_unclear: !normalizedDueDate,
    estimated_minutes: estimatedMinutes,
    difficulty,
    priority,
    requirements: cleaned
      .split(/(?:\n|;|\.)/)
      .map((item) => item.trim())
      .filter((item) => item.length > 20)
      .slice(0, 5),
    grading_weight: "",
    ai_summary: summarizeAssignmentText(cleaned),
    steps: [
      {
        step_title: "Review the assignment instructions",
        step_description: "Read through the details and confirm what needs to be submitted.",
        estimated_minutes: 15,
        recommended_due_date: null,
      },
      {
        step_title: "Complete the main work",
        step_description: "Work through the assignment requirements and collect any needed notes.",
        estimated_minutes: Math.max(30, Math.round(estimatedMinutes * 0.7)),
        recommended_due_date: null,
      },
      {
        step_title: "Proofread and submit",
        step_description: "Check the final work against the requirements before submitting.",
        estimated_minutes: 15,
        recommended_due_date: normalizedDueDate,
      },
    ],
  };
}

