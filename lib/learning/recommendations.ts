import type { AssignmentWithRelations, Course } from "@/types/database";
import type { QuizQuestion } from "@/lib/quiz/types";
import { cleanStudyText } from "@/lib/assignments/presentation";

export type LearningResource = {
  title: string;
  url: string;
  sourceType: "video" | "article" | "textbook" | "course" | "practice";
  topicTag: string;
};

export type LearningRecovery = {
  topic: string;
  whyWrong: string;
  whyCorrect: string;
  commonMistakes: string[];
  keyConceptSummary: string;
  recommendedReviewMaterial: LearningResource[];
  suggestedNextQuestion: string;
  topicSummary: string;
  importantDefinitions: string[];
  keyFormulas: string[];
  misconceptions: string[];
  relatedCourseConcepts: string[];
  relatedAssignments: string[];
};

export type MasteryLevel = "Beginner" | "Developing" | "Competent" | "Proficient" | "Mastered";

const stopWords = new Set([
  "assignment",
  "course",
  "review",
  "question",
  "answer",
  "describe",
  "explain",
  "which",
  "what",
  "when",
  "where",
  "with",
  "from",
  "that",
  "this",
  "your",
  "about",
  "using",
  "details",
  "material",
]);

function encodeTopic(topic: string) {
  return encodeURIComponent(topic.trim().replace(/\s+/g, " "));
}

export function cleanTopic(value: string | null | undefined) {
  const fallback = "study skills";
  if (!value) return fallback;
  const words = value
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word.toLowerCase()));
  return words.slice(0, 5).join(" ") || fallback;
}

export function recommendResources(topicValue: string, courseName?: string | null): LearningResource[] {
  const topic = cleanTopic(topicValue || courseName);
  const query = encodeTopic(`${courseName || ""} ${topic}`.trim());
  return [
    {
      title: `Khan Academy practice: ${topic}`,
      url: `https://www.khanacademy.org/search?page_search_query=${query}`,
      sourceType: "practice",
      topicTag: topic,
    },
    {
      title: `OpenStax textbook search: ${topic}`,
      url: `https://openstax.org/search?query=${query}`,
      sourceType: "textbook",
      topicTag: topic,
    },
    {
      title: `CK-12 lesson search: ${topic}`,
      url: `https://www.ck12.org/search/?q=${query}`,
      sourceType: "article",
      topicTag: topic,
    },
    {
      title: `Crash Course videos: ${topic}`,
      url: `https://www.youtube.com/results?search_query=${query}+Crash+Course`,
      sourceType: "video",
      topicTag: topic,
    },
    {
      title: `MIT OpenCourseWare: ${topic}`,
      url: `https://ocw.mit.edu/search/?q=${query}`,
      sourceType: "course",
      topicTag: topic,
    },
  ];
}

export function masteryLevel(percent: number, attempts = 1): MasteryLevel {
  if (attempts <= 0) return "Beginner";
  if (percent >= 92 && attempts >= 3) return "Mastered";
  if (percent >= 82) return "Proficient";
  if (percent >= 68) return "Competent";
  if (percent >= 45) return "Developing";
  return "Beginner";
}

export function inferQuestionTopic(question: Pick<QuizQuestion, "topic" | "prompt" | "sourceHint">, fallbackTopic: string) {
  return cleanTopic(question.topic || question.prompt || question.sourceHint || fallbackTopic);
}

export function buildLearningRecovery({
  question,
  userAnswer,
  courseName,
  assignments,
  fallbackTopic,
}: {
  question: QuizQuestion;
  userAnswer?: string | null;
  courseName?: string | null;
  assignments?: AssignmentWithRelations[];
  fallbackTopic: string;
}): LearningRecovery {
  const topic = inferQuestionTopic(question, fallbackTopic);
  const resources = question.resources?.length ? question.resources : recommendResources(topic, courseName);
  const relatedAssignments =
    assignments
      ?.filter((assignment) => `${assignment.title} ${assignment.description || ""}`.toLowerCase().includes(topic.toLowerCase().split(" ")[0]))
      .map((assignment) => assignment.title)
      .slice(0, 3) ?? [];

  return {
    topic,
    whyWrong: userAnswer
      ? `Your answer focused on "${userAnswer}", but this question was checking whether you could connect ${topic} to the selected material.`
      : `This question was missed because the key idea for ${topic} was not identified clearly enough.`,
    whyCorrect: question.explanation || `The correct answer works because it directly supports the key idea behind ${topic}.`,
    commonMistakes: [
      `Recognizing a familiar word but not explaining how it works in ${topic}.`,
      "Choosing an answer that sounds broad but is not tied to the source material.",
      "Stopping at memorization instead of applying the idea to an example.",
    ],
    keyConceptSummary: `${topic} should be reviewed by naming the concept, explaining the evidence or process, and connecting it to one concrete example from your notes.`,
    recommendedReviewMaterial: resources,
    suggestedNextQuestion: `Apply ${topic} to a new example from your course notes, then explain why one tempting wrong answer would fail.`,
    topicSummary: `${topic} is the study focus behind this question. Aim to explain it in your own words, identify where it appears in your assignment, and use it in a short example.`,
    importantDefinitions: [
      `${topic}: the main idea, process, term, or skill this question is testing.`,
      `Evidence: the detail from your assignment or notes that proves the answer.`,
      "Application: using the idea in a new situation instead of only repeating it.",
    ],
    keyFormulas: [
      "Claim + evidence + explanation",
      "Term -> meaning -> example -> why it matters",
    ],
    misconceptions: question.choices?.filter((choice) => choice !== question.answer).slice(0, 3) ?? [
      "The longest answer is automatically correct.",
      "A vague summary is enough without source evidence.",
    ],
    relatedCourseConcepts: [courseName || "Current course", fallbackTopic, question.sourceHint || "Selected assignment material"],
    relatedAssignments: relatedAssignments.length ? relatedAssignments : assignments?.slice(0, 3).map((assignment) => assignment.title) ?? [],
  };
}

export function generateFlashcardDrafts({
  courses,
  assignments,
  missedQuestions,
}: {
  courses: Course[];
  assignments: AssignmentWithRelations[];
  missedQuestions: Array<{ question_text: string; correct_answer: string; explanation?: string | null; topic_tag?: string | null }>;
}) {
  const missedCards = missedQuestions.slice(0, 6).map((question) => ({
    topicTag: cleanTopic(question.topic_tag || question.question_text),
    front: question.question_text,
    back: question.explanation ? `${question.correct_answer}\n\nWhy: ${question.explanation}` : question.correct_answer,
    sourceType: "missed_question",
  }));

  const assignmentCards = assignments.slice(0, 6).map((assignment) => ({
    topicTag: cleanTopic(assignment.title),
    front: `What is the most important thing to remember for ${assignment.title}?`,
    back: cleanStudyText(assignment.description, assignment.notes, assignment.original_input, assignment.ai_summary),
    sourceType: "assignment",
  }));

  const courseCards = courses.slice(0, 4).map((course) => ({
    topicTag: cleanTopic(course.name),
    front: `What should you review next in ${course.name}?`,
    back: course.description || course.subject || "Review recent assignments, missed questions, and upcoming due dates.",
    sourceType: "course",
  }));

  return [...missedCards, ...assignmentCards, ...courseCards].slice(0, 12);
}
