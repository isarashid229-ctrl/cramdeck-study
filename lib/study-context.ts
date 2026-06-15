import { formatDueDate } from "@/lib/utils";
import type { AssignmentWithRelations, Course } from "@/types/database";
import type { QuizDifficulty, QuizQuestion, QuizType } from "@/lib/quiz/types";
import { buildLearningRecovery, cleanTopic, recommendResources } from "@/lib/learning/recommendations";
import { generateAcademicQuestions } from "@/lib/quiz/academic";

export type StudyScope = "assignment" | "course" | "all";

export type StudyContext = {
  scope: StudyScope;
  courseId: string | null;
  assignmentId: string | null;
  courseName: string;
  assignmentTitle?: string;
  topic: string;
  sourceLabel: string;
  material: string;
  assignments: AssignmentWithRelations[];
  needsMoreDetail: boolean;
};

export function buildStudyContext({
  courses,
  assignments,
  courseId,
  assignmentId,
  extraMaterial,
}: {
  courses: Course[];
  assignments: AssignmentWithRelations[];
  courseId: string;
  assignmentId: string;
  extraMaterial?: string;
}): StudyContext {
  const selectedAssignment = assignments.find((assignment) => assignment.id === assignmentId);
  const resolvedCourseId = selectedAssignment?.course_id || (courseId === "all" ? null : courseId);
  const selectedCourse = courses.find((course) => course.id === resolvedCourseId);
  const courseAssignments = resolvedCourseId
    ? assignments.filter((assignment) => assignment.course_id === resolvedCourseId)
    : assignments;
  const scopedAssignments = selectedAssignment ? [selectedAssignment] : courseAssignments;
  const courseName = selectedCourse?.name || "All Courses";
  const scope: StudyScope = selectedAssignment ? "assignment" : resolvedCourseId ? "course" : "all";
  const topic = selectedAssignment?.title || (selectedCourse ? `${selectedCourse.name} course review` : "CramDeck study review");
  const sourceLabel = selectedAssignment
    ? `Based on ${courseName} Assignment: ${selectedAssignment.title}`
    : selectedCourse
      ? `Based on ${courseName} Course: Entire Course`
      : "Based on your CramDeck coursework";

  const assignmentMaterial = scopedAssignments
    .map((assignment) =>
      [
        `Assignment: ${assignment.title}`,
        assignment.courses?.name ? `Course: ${assignment.courses.name}` : null,
        assignment.due_date ? `Due: ${formatDueDate(assignment.due_date)}` : null,
        assignment.description ? `Description: ${assignment.description}` : null,
        assignment.notes ? `Assignment notes: ${assignment.notes}` : null,
        assignment.ai_summary ? `Summary: ${assignment.ai_summary}` : null,
        assignment.original_input ? `Notes: ${assignment.original_input}` : null,
        Array.isArray(assignment.requirements) && assignment.requirements.length
          ? `Requirements: ${assignment.requirements.join("; ")}`
          : null,
        assignment.assignment_steps?.length
          ? `Steps: ${assignment.assignment_steps.map((step) => step.step_title).join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    )
    .filter(Boolean)
    .join("\n\n");

  const material = [assignmentMaterial, extraMaterial?.trim()].filter(Boolean).join("\n\n");
  const compactMaterial = material.replace(/\s+/g, " ").trim();

  return {
    scope,
    courseId: resolvedCourseId,
    assignmentId: selectedAssignment?.id || null,
    courseName,
    assignmentTitle: selectedAssignment?.title,
    topic,
    sourceLabel,
    material,
    assignments: scopedAssignments,
    needsMoreDetail: compactMaterial.length < 140,
  };
}

function extractKeywords(context: StudyContext) {
  const stopWords = new Set([
    "assignment",
    "course",
    "description",
    "summary",
    "notes",
    "requirements",
    "steps",
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "your",
    "review",
  ]);
  const words = `${context.topic} ${context.material}`
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()));

  return Array.from(new Set(words)).slice(0, 12);
}

function materialSentence(context: StudyContext, index: number) {
  const sentences = context.material
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24);

  return sentences[index % Math.max(sentences.length, 1)] || `${context.topic} is the key focus for this activity.`;
}

export function generateContextQuestions({
  context,
  difficulty,
  quizType,
  count,
}: {
  context: StudyContext;
  difficulty: QuizDifficulty;
  quizType: QuizType;
  count: number;
}): QuizQuestion[] {
  return generateAcademicQuestions({
    topic: context.topic,
    courseName: context.courseName,
    assignmentTitle: context.assignmentTitle,
    material: context.material,
    sourceLabel: context.sourceLabel,
    difficulty,
    quizType,
    count,
  });
}

export function generateLegacyContextQuestions({
  context,
  difficulty,
  quizType,
  count,
}: {
  context: StudyContext;
  difficulty: QuizDifficulty;
  quizType: QuizType;
  count: number;
}): QuizQuestion[] {
  const keywords = extractKeywords(context);
  const typeCycle: QuizType[] = ["multiple_choice", "short_answer", "flashcards"];
  const difficultyPrompt =
    difficulty === "easy" ? "identify" : difficulty === "medium" ? "explain" : "apply and evaluate";

  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const type = quizType === "mixed" ? typeCycle[index % typeCycle.length] : quizType;
    const keyword = keywords[index % Math.max(keywords.length, 1)] || context.topic;
    const hint = materialSentence(context, index);
    const id = `context-${Date.now()}-${index}`;
    const sourceHint = `${context.sourceLabel}. ${hint}`;
    const topic = cleanTopic(`${context.topic} ${keyword}`);
    const resources = recommendResources(topic, context.courseName);

    if (type === "multiple_choice") {
      const answer = `${difficultyPrompt.charAt(0).toUpperCase()}${difficultyPrompt.slice(1)} ${keyword} using details from ${context.topic}.`;
      const choices = [
        answer,
        `Ignore ${keyword} because it is unrelated to the selected material.`,
        `Only memorize the title without connecting it to the notes.`,
        `Replace the selected course details with a random outside topic.`,
      ];
      const question: QuizQuestion = {
        id,
        type,
        prompt: `${context.sourceLabel}: Which response best matches ${keyword}?`,
        choices,
        answer,
        explanation: `The correct answer connects ${keyword} directly to the selected ${context.scope}.`,
        sourceHint,
        topic,
        difficulty,
        source: context.sourceLabel,
        resources,
        distractorExplanations: {
          [choices[1]]: `This source selected ${keyword}, so treating it as unrelated misses the assignment evidence.`,
          [choices[2]]: "Title-only studying does not show understanding or application.",
          [choices[3]]: "The app is testing your selected CramDeck material, not a random outside topic.",
        },
      };
      return {
        ...question,
        recovery: buildLearningRecovery({
          question,
          courseName: context.courseName,
          assignments: context.assignments,
          fallbackTopic: context.topic,
        }),
      };
    }

    if (type === "flashcards") {
      const question: QuizQuestion = {
        id,
        type,
        prompt: `Flashcard front: What should you remember about ${keyword} in ${context.topic}?`,
        answer: `Flashcard back: ${hint}`,
        explanation: `This card is built from ${context.sourceLabel}.`,
        sourceHint,
        topic,
        difficulty,
        source: context.sourceLabel,
        resources,
      };
      return {
        ...question,
        recovery: buildLearningRecovery({
          question,
          courseName: context.courseName,
          assignments: context.assignments,
          fallbackTopic: context.topic,
        }),
      };
    }

    const question: QuizQuestion = {
      id,
      type: "short_answer",
      prompt: `${context.sourceLabel}: In 2-3 sentences, ${difficultyPrompt} ${keyword}.`,
      answer: hint,
      explanation: `A strong response should use this selected-material detail: ${hint}`,
      sourceHint,
      topic,
      difficulty,
      source: context.sourceLabel,
      resources,
    };
    return {
      ...question,
      recovery: buildLearningRecovery({
        question,
        courseName: context.courseName,
        assignments: context.assignments,
        fallbackTopic: context.topic,
      }),
    };
  });
}
