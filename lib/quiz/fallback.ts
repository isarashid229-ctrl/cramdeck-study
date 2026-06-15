import type { QuizQuestion, QuizRequest, QuizType } from "./types";
import { buildLearningRecovery, cleanTopic, recommendResources } from "@/lib/learning/recommendations";
import { generateAcademicQuestions } from "@/lib/quiz/academic";

const conceptWords = [
  "definition",
  "method",
  "evidence",
  "pattern",
  "example",
  "cause",
  "effect",
  "comparison",
  "summary",
  "application",
];

function normalizeTopic(request: QuizRequest) {
  return (
    request.assignmentTitle ||
    request.courseName ||
    request.topic ||
    request.studyMaterial?.split(/\s+/).slice(0, 5).join(" ") ||
    "your study material"
  );
}

function pickQuestionType(baseType: QuizType, index: number): QuizType {
  if (baseType !== "mixed") return baseType;
  const cycle: QuizType[] = ["multiple_choice", "short_answer", "flashcards"];
  return cycle[index % cycle.length];
}

function sentenceFromMaterial(material: string | undefined, index: number, fallback: string) {
  const sentences =
    material
      ?.split(/(?<=[.!?])\s+/)
      .map((value) => value.trim())
      .filter((value) => value.length > 20) ?? [];

  return sentences[index % Math.max(sentences.length, 1)] || fallback;
}

export function generateFallbackQuiz(request: QuizRequest): QuizQuestion[] {
  return generateAcademicQuestions({
    topic: normalizeTopic(request),
    courseName: request.courseName,
    assignmentTitle: request.assignmentTitle,
    material: request.studyMaterial,
    sourceLabel: request.sourceLabel,
    difficulty: request.difficulty,
    quizType: request.quizType,
    count: request.questionCount || 5,
  });
}

export function generateLegacyFallbackQuiz(request: QuizRequest): QuizQuestion[] {
  const topic = normalizeTopic(request);
  const count = Math.max(request.questionCount || 5, 1);
  const difficultyCue =
    request.difficulty === "easy"
      ? "the core idea"
      : request.difficulty === "medium"
        ? "how the idea works"
        : "how to apply and critique the idea";

  return Array.from({ length: count }, (_, index) => {
    const type = pickQuestionType(request.quizType, index);
    const concept = conceptWords[index % conceptWords.length];
    const materialHint = sentenceFromMaterial(
      request.studyMaterial,
      index,
      `${topic} requires understanding the ${concept} and explaining it clearly.`
    );
    const sourceHint = request.sourceLabel ? `${request.sourceLabel}. ${materialHint}` : materialHint;
    const id = `fallback-${Date.now()}-${index}`;
    const topicTag = cleanTopic(`${topic} ${concept}`);
    const resources = recommendResources(topicTag, request.courseName);

    if (type === "multiple_choice") {
      const answer = `Explain the ${concept} in your own words, then connect it to an example.`;
      const choices = [
        answer,
        `Memorize a random phrase without checking what it means.`,
        `Skip the material and only review the title.`,
        `Focus only on formatting instead of the actual idea.`,
      ];
      const question: QuizQuestion = {
        id,
        type,
        prompt: `Which answer best captures ${difficultyCue} for ${topic}?`,
        choices,
        answer,
        explanation: `A strong answer shows understanding and can connect ${topic} to a specific example.`,
        sourceHint,
        topic: topicTag,
        difficulty: request.difficulty,
        source: request.sourceLabel || "Fallback generator",
        resources,
        distractorExplanations: {
          [choices[1]]: "Memorizing without meaning usually fails on application questions.",
          [choices[2]]: "The title can orient you, but it is not enough evidence for an answer.",
          [choices[3]]: "Presentation helps, but the question is testing the concept first.",
        },
      };
      return { ...question, recovery: buildLearningRecovery({ question, courseName: request.courseName, fallbackTopic: topic }) };
    }

    if (type === "flashcards") {
      const question: QuizQuestion = {
        id,
        type,
        prompt: `Flashcard front: What should you remember about the ${concept} in ${topic}?`,
        answer: `Flashcard back: ${materialHint}`,
        explanation: `Use this as a quick recall card before studying details.`,
        sourceHint,
        topic: topicTag,
        difficulty: request.difficulty,
        source: request.sourceLabel || "Fallback generator",
        resources,
      };
      return { ...question, recovery: buildLearningRecovery({ question, courseName: request.courseName, fallbackTopic: topic }) };
    }

    const question: QuizQuestion = {
      id,
      type: "short_answer",
      prompt: `In 2-3 sentences, explain the ${concept} of ${topic}.`,
      answer: materialHint,
      explanation: `Compare your response to the key idea: ${materialHint}`,
      sourceHint,
      topic: topicTag,
      difficulty: request.difficulty,
      source: request.sourceLabel || "Fallback generator",
      resources,
    };
    return { ...question, recovery: buildLearningRecovery({ question, courseName: request.courseName, fallbackTopic: topic }) };
  });
}
