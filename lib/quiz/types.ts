import type { LearningRecovery, LearningResource } from "@/lib/learning/recommendations";

export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuizType = "multiple_choice" | "short_answer" | "flashcards" | "mixed";

export type QuizQuestion = {
  id: string;
  prompt: string;
  type: QuizType;
  choices?: string[];
  answer: string;
  explanation: string;
  sourceHint?: string;
  topic?: string;
  difficulty?: QuizDifficulty;
  source?: string;
  distractorExplanations?: Record<string, string>;
  resources?: LearningResource[];
  recovery?: LearningRecovery;
  learningObjective?: string;
  keyConceptSummary?: string;
  commonMistake?: string;
  cognitiveSkill?: "recall" | "application" | "analysis" | "evaluation";
};

export type QuizRequest = {
  topic: string;
  courseName?: string;
  assignmentTitle?: string;
  studyMaterial?: string;
  sourceLabel?: string;
  difficulty: QuizDifficulty;
  quizType: QuizType;
  questionCount: number;
};

export type QuizResult = {
  id: string;
  topic: string;
  difficulty: QuizDifficulty;
  quizType: QuizType;
  score: number;
  total: number;
  createdAt: string;
};
