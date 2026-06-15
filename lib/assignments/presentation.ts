const titleLabelPattern =
  /\b(course|class|due date|deadline|estimated time|time estimate|priority|difficulty|teacher|requirements?|description|notes?)\s*:/gi;

export function cleanAssignmentTitle(input: string | null | undefined) {
  const raw = (input || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Untitled assignment";

  const firstLine = raw.split(/\n/).map((line) => line.trim()).find(Boolean) || raw;
  const beforeLabels = firstLine.split(titleLabelPattern)[0]?.trim() || firstLine;
  const withoutLabels = beforeLabels
    .replace(titleLabelPattern, "")
    .replace(/\b(due|deadline)\b.*$/i, "")
    .replace(/\s+\b(write|complete|answer|submit|include|create|read|solve|analyze)\b.*$/i, "")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?.*$/i, "")
    .replace(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+[a-z]+\s+\d{1,2}.*$/i, "")
    .replace(/\s[-–—]\s.*$/g, "")
    .replace(/[.。]+$/g, "")
    .trim();

  const heading = withoutLabels || raw.split(/[.!?]/)[0]?.trim() || raw;
  const cleaned = heading
    .replace(/^(title|assignment)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= 80) return cleaned || "Untitled assignment";
  const words = cleaned.slice(0, 96).split(" ");
  words.pop();
  return `${words.join(" ").trim()}...`;
}

export function formatStudyTime(minutes: number | null | undefined) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes || 0)));
  if (safeMinutes < 60) return `${safeMinutes || 0} min`;
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;
  if (!remaining) return hours === 1 ? "1 hr" : `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

export function estimateMinutesFromText(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const requirementCount = (text.match(/\b(submit|write|read|answer|solve|create|analyze|review|include)\b/gi) || []).length;
  const base = words < 80 ? 30 : words < 220 ? 60 : words < 550 ? 100 : words < 1000 ? 150 : 210;
  return Math.min(360, base + Math.min(90, requirementCount * 10));
}

export function summarizeAssignmentText(text: string) {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/^(title|assignment)\s*:\s*/i, "")
    .replace(/\b(course|class|due date|deadline|estimated time|priority)\s*:/gi, "$1:")
    .trim();
  if (!cleaned) return "Review the assignment details, break the work into steps, and submit before the deadline.";
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] || cleaned;
  return firstSentence.length > 220 ? `${firstSentence.slice(0, 217).trim()}...` : firstSentence;
}

export function cleanStudyText(...values: Array<string | null | undefined>) {
  return (
    values
      .map((value) => value?.trim())
      .find(
        (value) =>
          value &&
          !/openai api key/i.test(value) &&
          !/using demo extraction/i.test(value) &&
          !/database setup required/i.test(value) &&
          !/storage bucket/i.test(value)
      ) || "Review the assignment details, break the work into steps, and submit before the deadline."
  );
}
