import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateFallbackQuiz } from "@/lib/quiz/fallback";
import type { QuizQuestion, QuizRequest } from "@/lib/quiz/types";
import { buildLearningRecovery, cleanTopic, recommendResources } from "@/lib/learning/recommendations";

function clampQuestionCount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(Math.round(parsed), 1);
}

function normalizeRequest(body: Partial<QuizRequest>): QuizRequest {
  return {
    topic: body.topic?.trim() || "General study practice",
    courseName: body.courseName?.trim(),
    assignmentTitle: body.assignmentTitle?.trim(),
    studyMaterial: body.studyMaterial?.trim(),
    sourceLabel: body.sourceLabel?.trim(),
    difficulty: body.difficulty === "easy" || body.difficulty === "hard" ? body.difficulty : "medium",
    quizType:
      body.quizType === "multiple_choice" ||
      body.quizType === "short_answer" ||
      body.quizType === "flashcards" ||
      body.quizType === "mixed"
        ? body.quizType
        : "mixed",
    questionCount: clampQuestionCount(body.questionCount),
  };
}

function isValidQuestion(question: Partial<QuizQuestion>): question is QuizQuestion {
  return Boolean(question.id && question.prompt && question.type && question.answer && question.explanation);
}

function enrichQuestion(question: QuizQuestion, request: QuizRequest): QuizQuestion {
  const topic = cleanTopic(question.topic || request.assignmentTitle || request.topic || question.prompt);
  const resources = question.resources?.length ? question.resources : recommendResources(topic, request.courseName);
  const enriched = {
    ...question,
    topic,
    difficulty: question.difficulty || request.difficulty,
    source: question.source || request.sourceLabel || "Quiz generator",
    sourceHint: question.sourceHint || request.sourceLabel,
    resources,
    learningObjective:
      question.learningObjective ||
      `Apply ${topic} using evidence from ${request.assignmentTitle || request.courseName || "the selected material"}.`,
    keyConceptSummary:
      question.keyConceptSummary ||
      `${topic} should be explained, applied to evidence, and used to justify a conclusion.`,
    commonMistake:
      question.commonMistake ||
      `Students often recognize ${topic} but do not connect it to the assignment evidence.`,
    cognitiveSkill: question.cognitiveSkill || (request.difficulty === "hard" ? "analysis" : request.difficulty === "medium" ? "application" : "recall"),
  };
  return {
    ...enriched,
    recovery:
      question.recovery ||
      buildLearningRecovery({
        question: enriched,
        courseName: request.courseName,
        fallbackTopic: request.topic,
      }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<QuizRequest>;
    const quizRequest = normalizeRequest(body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        provider: "fallback",
        questions: generateFallbackQuiz(quizRequest),
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate rigorous AP, honors, SAT/ACT, and college-prep style student practice quizzes. Return JSON only with a questions array. Every question must be grounded in the provided assignment/course material, use realistic scenarios or evidence, and avoid generic trivia. Each question needs id, prompt, type, choices when multiple_choice, answer, explanation, sourceHint, topic, source, difficulty, learningObjective, keyConceptSummary, commonMistake, cognitiveSkill, and distractorExplanations when multiple_choice. Wrong answers must be believable and each explanation must say why the correct answer is right and why distractors are wrong.",
        },
        {
          role: "user",
          content: JSON.stringify({
            ...quizRequest,
            instruction:
            "First infer 4-8 learning objectives from the assignment/course material. Then generate questions across those objectives. Easy questions should still be meaningful, medium questions should require application/comparison, and hard questions should require scenario analysis, evidence evaluation, or multi-step reasoning. For short_answer questions, provide a model answer using claim-evidence-reasoning. For flashcards, prompt should be the card front and answer the card back.",
            sourceLabel: quizRequest.sourceLabel,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    const parsed = content ? JSON.parse(content) : null;
    const questions = Array.isArray(parsed?.questions)
      ? parsed.questions
          .map((question: Partial<QuizQuestion>, index: number) => ({
            ...question,
            id: question.id || `ai-${Date.now()}-${index}`,
          }))
          .filter(isValidQuestion)
          .map((question: QuizQuestion) => enrichQuestion(question, quizRequest))
      : [];

    if (questions.length === 0) {
      return NextResponse.json({
        provider: "fallback",
        questions: generateFallbackQuiz(quizRequest),
      });
    }

    return NextResponse.json({ provider: "openai", questions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { provider: "fallback", questions: generateFallbackQuiz(normalizeRequest({})) },
      { status: 200 }
    );
  }
}
