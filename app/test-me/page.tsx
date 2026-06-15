"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Skeleton, ShopSkeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssignments, useCourses } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import type { QuizDifficulty, QuizQuestion, QuizResult, QuizType } from "@/lib/quiz/types";
import { awardPoints } from "@/lib/rewards";
import { useQueryClient } from "@tanstack/react-query";
import { buildStudyContext, generateContextQuestions } from "@/lib/study-context";
import { isDueToday, isOverdue } from "@/lib/utils";
import { buildLearningRecovery } from "@/lib/learning/recommendations";

type QuizProvider = "openai" | "fallback";
type PracticeDifficulty = QuizDifficulty | "exam" | "challenge";
type PracticeMode = QuizType | "timed_exam" | "mistake_review" | "fill_blank" | "concept_match";
type AnswerRecord = {
  questionId: string;
  answer: string;
  correct: boolean;
};

const historyKey = "cramdeck-quiz-history";

function readHistory(): QuizResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(historyKey) || "[]") as QuizResult[];
  } catch {
    return [];
  }
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function TestMePage() {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("all");
  const [assignmentId, setAssignmentId] = useState("course");
  const [topic, setTopic] = useState("");
  const [studyMaterial, setStudyMaterial] = useState("");
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>("medium");
  const [quizType, setQuizType] = useState<PracticeMode>("mixed");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [provider, setProvider] = useState<QuizProvider>("fallback");
  const [activeIndex, setActiveIndex] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [savedAttempt, setSavedAttempt] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  useEffect(() => {
    setHistory(readHistory());
    setDifficulty((window.localStorage.getItem("cramdeck-default-difficulty") as PracticeDifficulty) || "medium");
    setQuestionCount(Number(window.localStorage.getItem("cramdeck-default-question-count") || 5));
    const params = new URLSearchParams(window.location.search);
    const assignmentParam = params.get("assignmentId");
    const courseParam = params.get("courseId");
    if (assignmentParam) setAssignmentId(assignmentParam);
    if (courseParam) setCourseId(courseParam);
  }, []);

  const selectedCourse = courses.find((course) => course.id === courseId);
  const selectedAssignment = assignments.find((assignment) => assignment.id === assignmentId);
  const loadingData = coursesLoading || assignmentsLoading;

  const relevantAssignments = useMemo(() => {
    if (courseId === "all") return assignments;
    return assignments.filter((assignment) => assignment.course_id === courseId);
  }, [assignments, courseId]);

  const studyContext = useMemo(
    () =>
      buildStudyContext({
        courses,
        assignments,
        courseId,
        assignmentId,
        extraMaterial: studyMaterial,
      }),
    [assignmentId, assignments, courseId, courses, studyMaterial]
  );

  useEffect(() => {
    if (selectedAssignment) {
      setCourseId(selectedAssignment.course_id || "all");
      setTopic(selectedAssignment.title);
      setStudyMaterial(
        [
          selectedAssignment.description,
          selectedAssignment.notes,
          selectedAssignment.ai_summary,
          selectedAssignment.original_input,
          ...(Array.isArray(selectedAssignment.requirements) ? selectedAssignment.requirements : []),
          ...(selectedAssignment.assignment_steps ?? []).map((step) => step.step_title),
        ]
          .filter(Boolean)
          .join("\n")
      );
    } else if (assignmentId === "course" && selectedCourse) {
      setTopic(`${selectedCourse.name} course review`);
    }
  }, [assignmentId, selectedAssignment, selectedCourse]);

  const currentQuestion = questions[activeIndex];
  const currentAnswer = currentQuestion
    ? answers.find((answer) => answer.questionId === currentQuestion.id)
    : undefined;
  const currentRecovery =
    currentQuestion && currentAnswer
      ? currentQuestion.recovery ||
        buildLearningRecovery({
          question: currentQuestion,
          userAnswer: currentAnswer.answer,
          courseName: studyContext.courseName,
          assignments: studyContext.assignments,
          fallbackTopic: studyContext.topic,
        })
      : null;
  const score = answers.filter((answer) => answer.correct).length;
  const complete = questions.length > 0 && answers.length === questions.length;
  const progress = questions.length > 0 ? Math.round((answers.length / questions.length) * 100) : 0;
  const missedQuestions = questions.filter(
    (question) => answers.find((answer) => answer.questionId === question.id)?.correct === false
  );

  const materialFromAssignments = studyContext.material;
  const effectiveDifficulty: QuizDifficulty = difficulty === "exam" || difficulty === "challenge" ? "hard" : difficulty;
  const effectiveQuizType: QuizType =
    quizType === "timed_exam" || quizType === "mistake_review" || quizType === "concept_match"
      ? "mixed"
      : quizType === "fill_blank"
        ? "short_answer"
        : quizType;

  const generateQuiz = async () => {
    setLoading(true);
    setSavedAttempt(false);
    setAnswers([]);
    setActiveIndex(0);
    setDraftAnswer("");
    setLearnOpen(false);

    try {
      const response = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || studyContext.topic,
          courseName: studyContext.courseName,
          assignmentTitle: studyContext.assignmentTitle,
          studyMaterial: studyMaterial || materialFromAssignments,
          sourceLabel: studyContext.sourceLabel,
          difficulty: effectiveDifficulty,
          quizType: effectiveQuizType,
          questionCount,
        }),
      });
      const result = (await response.json()) as { provider?: QuizProvider; questions?: QuizQuestion[] };

      const generatedQuestions = result.questions?.length
        ? result.questions
        : generateContextQuestions({ context: studyContext, difficulty: effectiveDifficulty, quizType: effectiveQuizType, count: questionCount });

      setProvider(result.provider || "fallback");
      setQuestions(
        generatedQuestions.map((question) => ({
          ...question,
          sourceHint: question.sourceHint || studyContext.sourceLabel,
        }))
      );
      if (studyContext.needsMoreDetail) {
        toast.info("Add notes or details to this assignment to generate better questions.");
      }
      toast.success(result.provider === "openai" ? "AI quiz generated" : "Practice quiz generated");
    } catch {
      setProvider("fallback");
      setQuestions(generateContextQuestions({ context: studyContext, difficulty: effectiveDifficulty, quizType: effectiveQuizType, count: questionCount }));
      toast.info("Using fallback questions from your selected course or assignment.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (value = draftAnswer) => {
    if (!currentQuestion || currentAnswer) return;

    const submitted = value.trim();
    if (!submitted) {
      toast.error("Choose or type an answer first.");
      return;
    }

    const correct =
      currentQuestion.type === "multiple_choice"
        ? submitted === currentQuestion.answer
        : normalizeAnswer(submitted).length > 8 &&
          (normalizeAnswer(currentQuestion.answer).includes(normalizeAnswer(submitted)) ||
            normalizeAnswer(submitted).includes(normalizeAnswer(currentQuestion.answer).slice(0, 30)));

    setAnswers((existing) => [...existing, { questionId: currentQuestion.id, answer: submitted, correct }]);
    if (!correct) setLearnOpen(true);
  };

  const nextQuestion = () => {
    setDraftAnswer("");
    setLearnOpen(false);
    setActiveIndex((index) => Math.min(index + 1, questions.length - 1));
  };

  const retryMissed = () => {
    if (missedQuestions.length === 0) return;
    setQuestions(missedQuestions.map((question, index) => ({ ...question, id: `${question.id}-retry-${index}` })));
    setAnswers([]);
    setActiveIndex(0);
    setDraftAnswer("");
    setLearnOpen(false);
    setSavedAttempt(false);
  };

  const saveAttempt = async () => {
    const result: QuizResult = {
      id: `quiz-${Date.now()}`,
      topic: studyContext.topic,
      difficulty: effectiveDifficulty,
      quizType: effectiveQuizType,
      score,
      total: questions.length,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [result, ...history].slice(0, 12);
    window.localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    setHistory(nextHistory);
    setSavedAttempt(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const difficultyMultiplier = effectiveDifficulty === "hard" ? 1.6 : effectiveDifficulty === "medium" ? 1.25 : 1;
        const dueSoonBonus =
          selectedAssignment && (isDueToday(selectedAssignment.due_date) || isOverdue(selectedAssignment.due_date, selectedAssignment.status))
            ? 20
            : 0;
        const earned = Math.round(Math.max(20, score * 10) * difficultyMultiplier) + dueSoonBonus;
        const { data: attempt } = await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          course_id: studyContext.courseId,
          assignment_id: studyContext.assignmentId,
          topic: result.topic,
          difficulty: effectiveDifficulty,
          quiz_type: effectiveQuizType,
          score,
          total_questions: questions.length,
          points_earned: earned,
        }).select("id").single();

        if (attempt) {
          await supabase.from("quiz_questions").insert(
            questions.map((question, index) => {
              const answer = answers.find((item) => item.questionId === question.id);
              return {
                attempt_id: attempt.id,
                prompt: question.prompt,
                question_type: question.type,
                answer: question.answer,
                user_answer: answer?.answer || null,
                is_correct: Boolean(answer?.correct),
                explanation: question.explanation,
                topic_tag: question.topic || studyContext.topic,
                difficulty: question.difficulty || effectiveDifficulty,
                source: question.source || question.sourceHint || studyContext.sourceLabel,
                distractor_explanations: question.distractorExplanations || {},
                resources: question.resources || [],
                recovery: question.recovery || {},
                order_index: index,
              };
            })
          );
          const missedRows = questions
            .map((question) => {
              const answer = answers.find((item) => item.questionId === question.id);
              if (answer?.correct !== false) return null;
              return {
                user_id: user.id,
                course_id: studyContext.courseId,
                assignment_id: studyContext.assignmentId,
                quiz_attempt_id: attempt.id,
                question_text: question.prompt,
                correct_answer: question.answer,
                user_answer: answer.answer,
                explanation: question.explanation,
                source_hint: question.sourceHint || studyContext.sourceLabel,
                topic_tag: question.topic || studyContext.topic,
                resources: question.resources || [],
                recovery_plan: question.recovery || {},
                is_reviewed: false,
              };
            })
            .filter((row): row is NonNullable<typeof row> => Boolean(row));
          if (missedRows.length) await supabase.from("missed_questions").insert(missedRows);
        }

        await awardPoints(
          supabase,
          user.id,
          earned,
          studyContext.scope === "assignment" ? "Completed assignment quiz" : "Completed course review quiz",
          "quiz",
          attempt?.id || null,
          { courseId: studyContext.courseId, assignmentId: studyContext.assignmentId, activityType: "test_me" }
        );
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch {
      // Local history remains the source of truth until the optional quiz tables are installed.
    }

    toast.success("Quiz saved to history");
  };

  if (loadingData) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <ShopSkeleton />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <BrainCircuit className="h-3.5 w-3.5 text-primary" />
              Adaptive practice
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Test Me</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Choose a course, an assignment, or an entire-course review, then practice from your actual study material.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/assignments/new">Add notes as assignment</Link>
            </Button>
            <Button onClick={generateQuiz} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate quiz
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz setup</CardTitle>
                <CardDescription>Choose what you want to practice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Assignment or scope</Label>
                  <Select value={assignmentId} onValueChange={setAssignmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Entire Course</SelectItem>
                      {relevantAssignments.map((assignment) => (
                        <SelectItem key={assignment.id} value={assignment.id}>
                          {assignment.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{studyContext.sourceLabel}</p>
                  <p className="mt-1 text-muted-foreground">
                    {studyContext.needsMoreDetail
                      ? "Add notes or details to this assignment to generate better questions."
                      : `${studyContext.assignments.length} assignment${studyContext.assignments.length === 1 ? "" : "s"} included.`}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="topic">Focus topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Photosynthesis, Macbeth Act 2, linear equations..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Difficulty</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["easy", "Easy"],
                        ["medium", "Medium"],
                        ["hard", "Hard"],
                        ["exam", "Exam Mode"],
                        ["challenge", "Challenge Mode"],
                      ].map(([value, label]) => (
                        <Button
                          key={value}
                          type="button"
                          variant={difficulty === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDifficulty(value as PracticeDifficulty)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <Select value={difficulty} onValueChange={(value) => setDifficulty(value as PracticeDifficulty)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="exam">Exam Mode</SelectItem>
                        <SelectItem value="challenge">Challenge Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Quiz type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["mixed", "Mixed"],
                        ["multiple_choice", "Multiple choice"],
                        ["short_answer", "Short answer"],
                        ["flashcards", "Flashcards"],
                        ["timed_exam", "Timed exam"],
                        ["mistake_review", "Mistake review"],
                        ["fill_blank", "Fill blank"],
                        ["concept_match", "Concept match"],
                      ].map(([value, label]) => (
                        <Button
                          key={value}
                          type="button"
                          variant={quizType === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setQuizType(value as PracticeMode)}
                          className="justify-start whitespace-normal"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <Select value={quizType} onValueChange={(value) => setQuizType(value as PracticeMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                        <SelectItem value="short_answer">Short answer</SelectItem>
                        <SelectItem value="flashcards">Flashcards</SelectItem>
                        <SelectItem value="timed_exam">Timed exam</SelectItem>
                        <SelectItem value="mistake_review">Mistake review</SelectItem>
                        <SelectItem value="fill_blank">Fill in the blank</SelectItem>
                        <SelectItem value="concept_match">Concept match</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="question-count">Questions</Label>
                  <Input
                    id="question-count"
                    type="number"
                    min={1}
                    value={questionCount}
                    onChange={(event) => setQuestionCount(Number(event.target.value))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="study-material">Notes or study material</Label>
                  <Textarea
                    id="study-material"
                    value={studyMaterial}
                    onChange={(event) => setStudyMaterial(event.target.value)}
                    placeholder="Paste class notes, a rubric, textbook summary, or anything you want to be quizzed on."
                    className="min-h-36"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Quiz history
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Saved quiz attempts will appear here.</p>
                ) : (
                  history.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.topic}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {item.difficulty} · {item.quizType.replace("_", " ")}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {item.score}/{item.total}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {questions.length === 0 ? (
              <Card className="overflow-hidden">
                <CardContent className="grid gap-6 p-8 md:grid-cols-[1fr_220px] md:items-center">
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Target className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold">Build your practice set</h2>
                    <p className="mt-2 text-muted-foreground">
                      Select a course and assignment scope, then generate a quiz from that material. Fallback mode stays
                      tied to the selected course or assignment even without an OpenAI key.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Quick start</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try a mixed, medium quiz with 5 questions for a fast study check.
                    </p>
                    <Button className="mt-4 w-full" onClick={generateQuiz} disabled={loading}>
                      Start practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          Question {activeIndex + 1} of {questions.length}
                        </CardTitle>
                        <CardDescription>
                          {provider === "openai" ? "Generated with AI" : "Generated with fallback practice mode"} · {studyContext.sourceLabel}
                        </CardDescription>
                      </div>
                      <Badge className="capitalize">{difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Progress value={progress} className="h-2.5" />
                    <div>
                      <Badge variant="outline" className="mb-3 capitalize">
                        {currentQuestion.type.replace("_", " ")}
                      </Badge>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {currentQuestion.topic && <Badge variant="secondary">{currentQuestion.topic}</Badge>}
                        {currentQuestion.cognitiveSkill && (
                          <Badge variant="outline" className="capitalize">
                            {currentQuestion.cognitiveSkill}
                          </Badge>
                        )}
                        {currentQuestion.learningObjective && (
                          <Badge variant="outline" className="max-w-full whitespace-normal text-left">
                            Learning objective: {currentQuestion.learningObjective}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold leading-relaxed">{currentQuestion.prompt}</h2>
                      {currentQuestion.keyConceptSummary && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Key concept: </span>
                          {currentQuestion.keyConceptSummary}
                        </p>
                      )}
                    </div>

                    {currentQuestion.choices?.length ? (
                      <div className="grid gap-3">
                        {currentQuestion.choices.map((choice) => {
                          const selected = currentAnswer?.answer === choice || draftAnswer === choice;
                          return (
                            <button
                              key={choice}
                              type="button"
                              disabled={Boolean(currentAnswer)}
                              onClick={() => {
                                setDraftAnswer(choice);
                                submitAnswer(choice);
                              }}
                              className={`rounded-xl border p-4 text-left text-sm transition-colors ${
                                selected ? "border-primary bg-primary/10" : "hover:bg-muted"
                              }`}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          value={draftAnswer}
                          onChange={(event) => setDraftAnswer(event.target.value)}
                          disabled={Boolean(currentAnswer)}
                          placeholder="Type your answer..."
                          className="min-h-32"
                        />
                        {!currentAnswer && <Button onClick={() => submitAnswer()}>Check answer</Button>}
                      </div>
                    )}

                    {currentAnswer && (
                      <div
                        className={`rounded-xl border p-4 ${
                          currentAnswer.correct
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-red-500/30 bg-red-500/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          {currentAnswer.correct ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          {currentAnswer.correct ? "Correct" : "Review this one"}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                        {!currentAnswer.correct && (
                          <p className="mt-2 text-sm">
                            <span className="font-medium">Model answer:</span> {currentQuestion.answer}
                          </p>
                        )}
                        {currentQuestion.sourceHint && (
                          <p className="mt-2 text-xs text-muted-foreground">Source hint: {currentQuestion.sourceHint}</p>
                        )}
                        {currentRecovery && !currentAnswer.correct && (
                          <div className="mt-4 space-y-3 rounded-lg border bg-background/70 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">Learning recovery</p>
                                <p className="text-xs text-muted-foreground">Topic: {currentRecovery.topic}</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setLearnOpen((value) => !value)}>
                                {learnOpen ? "Hide topic" : "Learn this topic"}
                              </Button>
                            </div>
                            <div className="grid gap-3 text-sm md:grid-cols-2">
                              <div>
                                <p className="font-medium">Why yours missed</p>
                                <p className="text-muted-foreground">{currentRecovery.whyWrong}</p>
                              </div>
                              <div>
                                <p className="font-medium">Why correct works</p>
                                <p className="text-muted-foreground">{currentRecovery.whyCorrect}</p>
                              </div>
                            </div>
                            {learnOpen && (
                              <div className="space-y-4 border-t pt-3">
                                <div>
                                  <p className="text-sm font-medium">Key concept</p>
                                  <p className="text-sm text-muted-foreground">{currentRecovery.keyConceptSummary}</p>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <p className="text-sm font-medium">Common mistakes</p>
                                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                      {currentRecovery.commonMistakes.map((item) => (
                                        <li key={item}>- {item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Definitions and formulas</p>
                                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                                      {[...currentRecovery.importantDefinitions.slice(0, 2), ...currentRecovery.keyFormulas.slice(0, 2)].map(
                                        (item) => (
                                          <li key={item}>- {item}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>
                                {currentQuestion.distractorExplanations && (
                                  <div>
                                    <p className="text-sm font-medium">Why the wrong choices are wrong</p>
                                    <div className="mt-2 space-y-2">
                                      {Object.entries(currentQuestion.distractorExplanations).map(([choice, reason]) => (
                                        <p key={choice} className="rounded-md border p-2 text-xs text-muted-foreground">
                                          <span className="font-medium text-foreground">{choice}</span>: {reason}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium">Recommended review</p>
                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {currentRecovery.recommendedReviewMaterial.slice(0, 4).map((resource) => (
                                      <a
                                        key={resource.url}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-md border p-2 text-xs transition-colors hover:bg-muted"
                                      >
                                        <span className="block font-medium">{resource.title}</span>
                                        <span className="capitalize text-muted-foreground">{resource.sourceType}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                                <p className="rounded-md bg-muted p-2 text-sm">
                                  <span className="font-medium">Next question idea:</span> {currentRecovery.suggestedNextQuestion}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between gap-2">
                      <Button
                        variant="outline"
                        disabled={activeIndex === 0}
                        onClick={() => {
                          setDraftAnswer("");
                          setActiveIndex((index) => Math.max(index - 1, 0));
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      {activeIndex < questions.length - 1 ? (
                        <Button disabled={!currentAnswer} onClick={nextQuestion}>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button disabled={!complete || savedAttempt} onClick={saveAttempt}>
                          {savedAttempt ? "Saved" : `Save score ${score}/${questions.length}`}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {complete && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Final review</CardTitle>
                      <CardDescription>
                        Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="answers">
                        <TabsList>
                          <TabsTrigger value="answers">Answers</TabsTrigger>
                          <TabsTrigger value="missed">Missed</TabsTrigger>
                        </TabsList>
                        <TabsContent value="answers" className="space-y-3">
                          {questions.map((question, index) => {
                            const answer = answers.find((item) => item.questionId === question.id);
                            return (
                              <div key={question.id} className="rounded-xl border p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-medium">
                                    {index + 1}. {question.prompt}
                                  </p>
                                  {answer?.correct ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{question.explanation}</p>
                              </div>
                            );
                          })}
                        </TabsContent>
                        <TabsContent value="missed" className="space-y-4">
                          {missedQuestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No missed questions. Nicely done.</p>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Retry only the questions that need another pass.
                              </p>
                              <Button onClick={retryMissed}>
                                <RotateCcw className="h-4 w-4" />
                                Retry missed
                              </Button>
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  const supabase = createClient();
                                  const {
                                    data: { user },
                                  } = await supabase.auth.getUser();
                                  if (!user) return;
                                  await awardPoints(supabase, user.id, 15, "Reviewed missed questions", "review", null, {
                                    courseId: studyContext.courseId,
                                    assignmentId: studyContext.assignmentId,
                                    activityType: "missed_review",
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["profile"] });
                                  toast.success("Missed-question review logged. +15 points");
                                }}
                              >
                                Mark reviewed
                              </Button>
                            </>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
