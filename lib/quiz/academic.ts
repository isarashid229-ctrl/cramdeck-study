import type { QuizDifficulty, QuizQuestion, QuizType } from "@/lib/quiz/types";
import { buildLearningRecovery, cleanTopic, recommendResources } from "@/lib/learning/recommendations";

type AcademicContext = {
  topic: string;
  courseName?: string;
  assignmentTitle?: string;
  material?: string;
  sourceLabel?: string;
  difficulty: QuizDifficulty;
  quizType: QuizType;
  count: number;
};

const stopWords = new Set([
  "assignment",
  "course",
  "description",
  "summary",
  "notes",
  "requirements",
  "steps",
  "title",
  "write",
  "include",
  "review",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
]);

function subjectFor(context: AcademicContext) {
  const text = `${context.courseName || ""} ${context.assignmentTitle || ""} ${context.topic} ${context.material || ""}`.toLowerCase();
  if (/bio|cell|membrane|diffusion|osmosis|enzyme|genetic|ecology|photosynthesis/.test(text)) return "biology";
  if (/chem|mole|reaction|bond|acid|base|stoich|solution/.test(text)) return "chemistry";
  if (/algebra|geometry|calculus|equation|quadratic|function|graph|statistics|probability/.test(text)) return "math";
  if (/history|government|apush|revolution|constitution|war|primary source|civil/.test(text)) return "history";
  if (/psych|cognition|behavior|memory|learning|development/.test(text)) return "psychology";
  if (/physics|force|motion|energy|circuit|wave|momentum/.test(text)) return "physics";
  return "academic";
}

function extractConcepts(context: AcademicContext) {
  const words = `${context.assignmentTitle || ""} ${context.topic} ${context.material || ""}`
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()));
  return Array.from(new Set(words)).slice(0, 12).map((word) => cleanTopic(word));
}

function materialEvidence(context: AcademicContext, index: number) {
  const sentences =
    context.material
      ?.split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 28 && !/openai api key|demo extraction/i.test(sentence)) ?? [];
  return sentences[index % Math.max(sentences.length, 1)] || `${context.assignmentTitle || context.topic} is the selected study source.`;
}

function objectiveVerb(difficulty: QuizDifficulty, index: number) {
  const pools = {
    easy: ["Identify", "Explain", "Distinguish"],
    medium: ["Apply", "Compare", "Predict"],
    hard: ["Analyze", "Evaluate", "Justify"],
  };
  return pools[difficulty][index % pools[difficulty].length];
}

function scenario(subject: string, concept: string, evidence: string, difficulty: QuizDifficulty) {
  if (subject === "biology") {
    return difficulty === "hard"
      ? `A student is analyzing lab observations related to ${concept}. The notes say: "${evidence}" Which conclusion is best supported, and what evidence would weaken it?`
      : `A cell or organism is placed in a new condition related to ${concept}. The assignment notes say: "${evidence}" What outcome is most likely and why?`;
  }
  if (subject === "math") {
    return difficulty === "hard"
      ? `A classmate solves a problem involving ${concept} but gets a result that does not fit the original context. Which step should be checked first, and why?`
      : `A problem requires using ${concept} from the selected assignment. Which strategy best connects the given information to a valid solution?`;
  }
  if (subject === "history") {
    return difficulty === "hard"
      ? `A historian uses the assignment evidence about ${concept} to make a claim. Which interpretation is most defensible, and what limitation should be acknowledged?`
      : `Based on the assignment evidence about ${concept}, which cause-and-effect relationship is most accurate?`;
  }
  if (subject === "psychology") {
    return difficulty === "hard"
      ? `A researcher observes behavior connected to ${concept}. Which explanation best applies the concept while avoiding overgeneralization?`
      : `A scenario illustrates ${concept}. Which interpretation best matches the psychological principle?`;
  }
  if (subject === "chemistry") {
    return difficulty === "hard"
      ? `A lab result involving ${concept} differs from the predicted value. Which explanation best accounts for the discrepancy using evidence from the assignment?`
      : `A reaction or solution scenario involves ${concept}. Which prediction best follows from the assignment material?`;
  }
  if (subject === "physics") {
    return difficulty === "hard"
      ? `A system involving ${concept} changes conditions halfway through an experiment. Which quantity or relationship should be evaluated first?`
      : `A scenario applies ${concept}. Which prediction is most consistent with the relevant relationship?`;
  }
  return difficulty === "hard"
    ? `A student must defend a claim about ${concept} using the assignment evidence: "${evidence}" Which response shows the strongest reasoning?`
    : `Which response best applies ${concept} to the selected assignment evidence: "${evidence}"?`;
}

function choicesFor(subject: string, concept: string, evidence: string, difficulty: QuizDifficulty) {
  const answer = `Use the assignment evidence to connect ${concept} to a specific cause, process, or claim, then explain the reasoning.`;
  const distractors =
    subject === "math"
      ? [
          `Choose the operation that looks familiar without checking whether the units or context fit.`,
          `Copy a formula from memory and ignore what the variables represent in this assignment.`,
          `Estimate the answer first and treat the estimate as proof.`,
        ]
      : subject === "history"
        ? [
            `Treat one piece of evidence as the entire historical explanation.`,
            `Use present-day assumptions instead of the source context.`,
            `List facts without explaining cause, continuity, or change over time.`,
          ]
        : subject === "biology" || subject === "chemistry" || subject === "physics"
          ? [
              `Name the concept but ignore the conditions described in the evidence.`,
              `Assume the opposite trend because the terms sound similar.`,
              `Focus on a memorized definition without applying it to the scenario.`,
            ]
          : [
              `Repeat a keyword from the assignment without explaining its role.`,
              `Choose a broad claim that could fit almost any topic.`,
              `Ignore the evidence and answer from general memory only.`,
            ];
  const explanation = `The best answer is not just a definition. It uses the selected material (${evidence}) to reason about ${concept}.`;
  const distractorExplanations = Object.fromEntries(
    distractors.map((choice) => [
      choice,
      difficulty === "easy"
        ? "This answer is tempting because it uses familiar language, but it does not connect the concept to the selected assignment."
        : "This distractor sounds plausible, but it skips the evidence-to-reasoning link that college-prep questions require.",
    ])
  );
  return { answer, choices: [answer, ...distractors], explanation, distractorExplanations };
}

function pickType(baseType: QuizType, index: number): QuizType {
  if (baseType !== "mixed") return baseType;
  return (["multiple_choice", "short_answer", "flashcards"] as QuizType[])[index % 3];
}

export function generateAcademicQuestions(context: AcademicContext): QuizQuestion[] {
  const subject = subjectFor(context);
  const concepts = extractConcepts(context);
  const conceptList = concepts.length ? concepts : [cleanTopic(context.topic || context.assignmentTitle || context.courseName)];

  return Array.from({ length: Math.max(1, context.count) }, (_, index) => {
    const concept = conceptList[index % conceptList.length];
    const evidence = materialEvidence(context, index);
    const verb = objectiveVerb(context.difficulty, index);
    const type = pickType(context.quizType, index);
    const objective = `${verb} ${concept} using evidence from ${context.assignmentTitle || context.courseName || "the selected material"}.`;
    const sourceHint = `${context.sourceLabel || "Selected coursework"}. Evidence focus: ${evidence}`;
    const resources = recommendResources(concept, context.courseName);
    const base = {
      id: `academic-${Date.now()}-${index}`,
      type,
      topic: concept,
      difficulty: context.difficulty,
      source: context.sourceLabel || "Selected coursework",
      sourceHint,
      resources,
      learningObjective: objective,
      keyConceptSummary: `${concept} should be understood as a concept you can explain, apply to evidence, and use to justify a conclusion.`,
      commonMistake: `Students often recognize ${concept} but fail to connect it to the exact assignment evidence.`,
      cognitiveSkill:
        context.difficulty === "easy" ? "recall" : context.difficulty === "medium" ? "application" : "analysis",
    } satisfies Partial<QuizQuestion>;

    if (type === "multiple_choice") {
      const built = choicesFor(subject, concept, evidence, context.difficulty);
      const question: QuizQuestion = {
        ...base,
        id: base.id!,
        type,
        prompt: scenario(subject, concept, evidence, context.difficulty),
        choices: built.choices,
        answer: built.answer,
        explanation: built.explanation,
        distractorExplanations: built.distractorExplanations,
      };
      return { ...question, recovery: buildLearningRecovery({ question, courseName: context.courseName, fallbackTopic: context.topic }) };
    }

    if (type === "flashcards") {
      const question: QuizQuestion = {
        ...base,
        id: base.id!,
        type,
        prompt: `Flashcard front: ${objective}`,
        answer: `Flashcard back: ${concept} matters here because ${evidence}`,
        explanation: `This card connects a learning objective to assignment evidence instead of a bare definition.`,
      };
      return { ...question, recovery: buildLearningRecovery({ question, courseName: context.courseName, fallbackTopic: context.topic }) };
    }

    const question: QuizQuestion = {
      ...base,
      id: base.id!,
      type: "short_answer",
      prompt: `${scenario(subject, concept, evidence, context.difficulty)} Respond in 3-5 sentences with a claim, evidence, and reasoning.`,
      answer: `A strong response identifies ${concept}, uses this evidence (${evidence}), and explains why the evidence supports the conclusion.`,
      explanation: `Use claim-evidence-reasoning: name the concept, cite the assignment detail, then explain the connection.`,
    };
    return { ...question, recovery: buildLearningRecovery({ question, courseName: context.courseName, fallbackTopic: context.topic }) };
  });
}
