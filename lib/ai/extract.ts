import OpenAI from "openai";
import { aiExtractionSchema } from "@/lib/validators/assignment";
import { computePriority } from "@/lib/utils";
import type { AIExtractionResult } from "@/types/assignment";
import { cleanAssignmentTitle, estimateMinutesFromText, summarizeAssignmentText } from "@/lib/assignments/presentation";

const SYSTEM_PROMPT = `You are an expert academic assignment analyzer for students. Extract assignment details from the provided input.

Rules:
- Extract ONLY information supported by the input. Do not invent teacher names, dates, or requirements.
- If due date is unclear or missing, set due_date to null and due_date_unclear to true.
- Break large assignments into 3-8 realistic, actionable steps.
- Estimate workload (estimated_minutes) based on complexity and scope.
- difficulty is 1-5 (1=easy, 5=very hard).
- requirements should be a list of specific deliverables or grading criteria found in the input.
- title must be short, clean, and usually under 80 characters.
- Never put the whole assignment text, course label, due date, estimated time, or priority in title.
- Remove labels like "Course:", "Due Date:", "Estimated Time:", and "Priority:" from title and place those values in their fields.
- grading_weight: extract if mentioned, otherwise empty string.
- ai_summary: 2-3 sentence student-friendly summary of what needs to be done.
- course: extract course/subject name if mentioned, otherwise empty string.
- Return valid JSON only, no markdown.

Response schema:
{
  "title": "string",
  "course": "string",
  "description": "string",
  "due_date": "ISO 8601 string or null",
  "due_date_unclear": boolean,
  "estimated_minutes": number,
  "difficulty": 1-5,
  "priority": "low|medium|high|urgent",
  "requirements": ["string"],
  "grading_weight": "string",
  "ai_summary": "string",
  "steps": [{
    "step_title": "string",
    "step_description": "string",
    "estimated_minutes": number,
    "recommended_due_date": "ISO 8601 or null"
  }]
}`;

export async function extractAssignmentFromText(text: string): Promise<AIExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackAssignmentExtraction(text);
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this assignment input and extract structured data:\n\n${text}`,
      },
    ],
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  const validated = aiExtractionSchema.parse(parsed);

  const priority = computePriority(
    validated.due_date,
    validated.difficulty,
    validated.estimated_minutes
  );

  return {
    ...validated,
    title: cleanAssignmentTitle(validated.title),
    priority,
  };
}

export function fallbackAssignmentExtraction(text: string): AIExtractionResult {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const titleMatch = cleaned.match(/(?:title|assignment)\s*:\s*([^.\n]+)/i);
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

/** Upload text fallback used when no pasted text is provided with a file. */
export function fallbackOcrExtract(fileName: string, fileType: string): string {
  return `Uploaded file: ${fileName} (${fileType}).
  
Text extraction fallback is active.

For now, please use the Paste or Manual entry tabs to provide assignment text, or ensure your screenshot/PDF contains readable text that you paste alongside the upload.

Sample detected content hint: Assignment document uploaded — please review extracted fields after AI processing.`;
}
