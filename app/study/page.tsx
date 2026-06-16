"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpenCheck, BrainCircuit, CheckCircle2, Clock, ExternalLink, Flame, Layers3, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Skeleton, ShopSkeleton } from "@/components/layout/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssignments, useCourses, useProfile, isMissingSchemaError } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import {
  cleanTopic,
  generateFlashcardDrafts,
  masteryLevel,
  recommendResources,
} from "@/lib/learning/recommendations";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type MissedRow = {
  id: string;
  question_text: string;
  correct_answer: string;
  explanation: string | null;
  topic_tag: string | null;
  source_hint: string | null;
  created_at: string;
};

type QuizAttemptRow = {
  id: string;
  topic: string;
  score: number;
  total_questions: number;
  created_at: string;
};

type GameRow = {
  id: string;
  game_type: string;
  result: "win" | "loss";
  created_at: string;
};

type FlashcardRow = {
  id: string;
  topic_tag: string;
  front: string;
  back: string;
  is_favorite: boolean;
  created_at: string;
};

function percent(score: number, total: number) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

export default function StudyPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const [savingCard, setSavingCard] = useState<string | null>(null);

  const { data: missedQuestions = [], isLoading: missedLoading } = useQuery({
    queryKey: ["study-missed-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missed_questions")
        .select("id, question_text, correct_answer, explanation, topic_tag, source_hint, created_at")
        .eq("is_reviewed", false)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data as MissedRow[];
    },
    enabled: Boolean(profile?.id),
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["study-quiz-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id, topic, score, total_questions, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data as QuizAttemptRow[];
    },
    enabled: Boolean(profile?.id),
  });

  const { data: gameResults = [] } = useQuery({
    queryKey: ["study-game-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_results")
        .select("id, game_type, result, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data as GameRow[];
    },
    enabled: Boolean(profile?.id),
  });

  const { data: savedFlashcards = [] } = useQuery({
    queryKey: ["study-flashcards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("id, topic_tag, front, back, is_favorite, created_at")
        .order("created_at", { ascending: false })
        .limit(16);
      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data as FlashcardRow[];
    },
    enabled: Boolean(profile?.id),
  });

  const topicStats = useMemo(() => {
    const map = new Map<string, { topic: string; missed: number; correct: number; attempts: number; lastSeen: string }>();
    missedQuestions.forEach((question) => {
      const topic = cleanTopic(question.topic_tag || question.question_text);
      const row = map.get(topic) || { topic, missed: 0, correct: 0, attempts: 0, lastSeen: question.created_at };
      row.missed += 1;
      row.attempts += 1;
      row.lastSeen = question.created_at > row.lastSeen ? question.created_at : row.lastSeen;
      map.set(topic, row);
    });
    quizAttempts.forEach((attempt) => {
      const topic = cleanTopic(attempt.topic);
      const row = map.get(topic) || { topic, missed: 0, correct: 0, attempts: 0, lastSeen: attempt.created_at };
      row.correct += attempt.score;
      row.missed += Math.max(0, attempt.total_questions - attempt.score);
      row.attempts += Math.max(1, attempt.total_questions);
      row.lastSeen = attempt.created_at > row.lastSeen ? attempt.created_at : row.lastSeen;
      map.set(topic, row);
    });
    return Array.from(map.values()).sort((a, b) => b.missed - a.missed || b.lastSeen.localeCompare(a.lastSeen));
  }, [missedQuestions, quizAttempts]);

  const weakTopics = topicStats.filter((topic) => topic.missed > topic.correct || percent(topic.correct, topic.attempts) < 68);
  const mediumTopics = topicStats.filter((topic) => percent(topic.correct, topic.attempts) >= 68 && percent(topic.correct, topic.attempts) < 85);
  const dueSoon = assignments
    .filter((assignment) => assignment.status !== "completed" && assignment.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 3);
  const nextTopic = weakTopics[0]?.topic || dueSoon[0]?.title || assignments[0]?.title || courses[0]?.name || "daily review";
  const resources = recommendResources(nextTopic, courses[0]?.name);
  const draftFlashcards = generateFlashcardDrafts({ courses, assignments, missedQuestions });
  const recentLosses = gameResults.filter((game) => game.result === "loss").slice(0, 3);
  const loading = profileLoading || coursesLoading || assignmentsLoading || missedLoading;

  const saveFlashcard = async (card: (typeof draftFlashcards)[number], favorite = false) => {
    if (!profile?.id) {
      toast.error("Log in to save flashcards.");
      return;
    }
    setSavingCard(card.front);
    const { error } = await supabase.from("flashcards").insert({
      user_id: profile.id,
      topic_tag: card.topicTag,
      front: card.front,
      back: card.back,
      source_type: card.sourceType,
      is_favorite: favorite,
    });
    setSavingCard(null);
    if (error) {
      toast.error(isMissingSchemaError(error) ? "Run the updated Supabase setup to save flashcards." : "Could not save flashcard.");
      return;
    }
    toast.success(favorite ? "Flashcard saved and favorited" : "Flashcard saved");
    queryClient.invalidateQueries({ queryKey: ["study-flashcards"] });
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
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
              <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
              Smart review center
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Study</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Review weak topics, save flashcards, and choose the next study session from your real EagleCram work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/test-me">Test Me</Link>
            </Button>
            <Button asChild>
              <Link href={`/games${dueSoon[0]?.id ? `?assignmentId=${dueSoon[0].id}` : ""}`}>Practice game</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Weak topics</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{weakTopics.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Saved flashcards</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{savedFlashcards.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent mistakes</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{missedQuestions.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Game losses to review</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{recentLosses.length}</CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  Smart Review Mode
                </CardTitle>
                <CardDescription>Pick a review set based on your quiz history, mistakes, and games.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="weak">
                  <TabsList className="flex h-auto flex-wrap justify-start">
                    <TabsTrigger value="weak">Weak Topics</TabsTrigger>
                    <TabsTrigger value="medium">Medium Topics</TabsTrigger>
                    <TabsTrigger value="all">Everything</TabsTrigger>
                  </TabsList>
                  {[
                    ["weak", weakTopics],
                    ["medium", mediumTopics],
                    ["all", topicStats],
                  ].map(([key, topics]) => (
                    <TabsContent key={String(key)} value={String(key)} className="space-y-3">
                      {(topics as typeof topicStats).length === 0 ? (
                        <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                          No topics in this review set yet. Take a quiz or play a game to build your study map.
                        </p>
                      ) : (
                        (topics as typeof topicStats).slice(0, 8).map((topic) => {
                          const accuracy = percent(topic.correct, topic.attempts);
                          const level = masteryLevel(accuracy, topic.attempts);
                          return (
                            <div key={topic.topic} className="rounded-xl border p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium capitalize">{topic.topic}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {topic.correct} correct · {topic.missed} missed · {level}
                                  </p>
                                </div>
                                <Badge variant={accuracy >= 80 ? "default" : "secondary"}>{accuracy}%</Badge>
                              </div>
                              <Progress value={accuracy} className="mt-3" />
                            </div>
                          );
                        })
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers3 className="h-4 w-4 text-primary" />
                  Flashcards
                </CardTitle>
                <CardDescription>Generated from missed questions, assignments, and course context.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {draftFlashcards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add assignments or take a quiz to generate flashcards.</p>
                ) : (
                  draftFlashcards.map((card) => (
                    <div key={`${card.sourceType}-${card.front}`} className="rounded-xl border p-4">
                      <Badge variant="outline" className="mb-2 capitalize">
                        {card.topicTag}
                      </Badge>
                      <p className="font-medium">{card.front}</p>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{card.back}</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => saveFlashcard(card)} disabled={savingCard === card.front}>
                          {savingCard === card.front ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => saveFlashcard(card, true)} disabled={savingCard === card.front}>
                          <Star className="h-3.5 w-3.5" />
                          Favorite
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  Next study session
                </CardTitle>
                <CardDescription>Balanced from deadlines, weak topics, and recent mistakes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-sm font-medium capitalize">{nextTopic}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Spend 25 minutes reviewing the key concept, then answer 5 questions and save two flashcards.
                  </p>
                </div>
                <div className="space-y-2">
                  {["Review weak topic notes", "Take one Test Me set", "Favorite one flashcard"].map((step, index) => (
                    <div key={step} className="flex items-center gap-2 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Recommended resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resources.map((resource) => (
                  <a
                    key={resource.url}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn("block rounded-xl border p-3 transition-colors hover:bg-muted")}
                  >
                    <p className="text-sm font-medium">{resource.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{resource.sourceType}</p>
                  </a>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="h-4 w-4 text-primary" />
                  Upcoming tests and deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dueSoon.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming assignments. Use this window for weak-topic review.</p>
                ) : (
                  dueSoon.map((assignment) => (
                    <Link key={assignment.id} href={`/assignments/${assignment.id}`} className="block rounded-xl border p-3 hover:bg-muted">
                      <p className="text-sm font-medium">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.courses?.name || "No course linked"}</p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
