"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, Coins, Gamepad2, Swords, Trophy, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ShopSkeleton, Skeleton } from "@/components/layout/skeletons";
import { AvatarPreview } from "@/components/avatar/avatar-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isMissingSchemaError, useAssignments, useCourses, useProfile } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { awardPoints } from "@/lib/rewards";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buildStudyContext, generateContextQuestions } from "@/lib/study-context";
import type { QuizDifficulty, QuizQuestion } from "@/lib/quiz/types";
import { isDueToday, isOverdue } from "@/lib/utils";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { recommendResources } from "@/lib/learning/recommendations";

type GameId = "quiz_duel" | "flashcard_race" | "memory_match" | "deadline_sprint" | "boss_quiz";

const games: Array<{
  id: GameId;
  title: string;
  description: string;
  opponent: string;
  reward: number;
  difficulty: number;
}> = [
  {
    id: "quiz_duel",
    title: "Quiz Duel",
    description: "Answer faster than a fallback AI rival across quick study questions.",
    opponent: "Byte Rival",
    reward: 80,
    difficulty: 62,
  },
  {
    id: "flashcard_race",
    title: "Flashcard Race",
    description: "Flip recall cards and move your avatar across the finish line.",
    opponent: "Cardbot",
    reward: 65,
    difficulty: 55,
  },
  {
    id: "memory_match",
    title: "Memory Match",
    description: "Match terms and definitions before the AI completes its board.",
    opponent: "Mnemonic Core",
    reward: 70,
    difficulty: 58,
  },
  {
    id: "deadline_sprint",
    title: "Deadline Sprint",
    description: "Study an upcoming assignment and earn a due-soon bonus.",
    opponent: "Deadline AI",
    reward: 75,
    difficulty: 60,
  },
  {
    id: "boss_quiz",
    title: "Boss Quiz",
    description: "Fight a harder AI opponent with cumulative quiz damage.",
    opponent: "The Deadline",
    reward: 120,
    difficulty: 74,
  },
];

export default function GamesPage() {
  const { data: profile, isLoading } = useProfile();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [activeGame, setActiveGame] = useState(games[0]);
  const [courseId, setCourseId] = useState("all");
  const [assignmentId, setAssignmentId] = useState("course");
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [round, setRound] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [status, setStatus] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [saving, setSaving] = useState(false);
  const [gameQuestions, setGameQuestions] = useState<QuizQuestion[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assignmentParam = params.get("assignmentId");
    const courseParam = params.get("courseId");
    if (assignmentParam) setAssignmentId(assignmentParam);
    if (courseParam) setCourseId(courseParam);
  }, []);

  const selectedAssignment = assignments.find((assignment) => assignment.id === assignmentId);
  const relevantAssignments = useMemo(() => {
    if (courseId === "all") return assignments;
    return assignments.filter((assignment) => assignment.course_id === courseId);
  }, [assignments, courseId]);
  const studyContext = useMemo(
    () => buildStudyContext({ courses, assignments, courseId, assignmentId }),
    [assignmentId, assignments, courseId, courses]
  );

  const { data: gameHistory = [] } = useQuery({
    queryKey: ["game_results", studyContext.courseId, studyContext.assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_results")
        .select("id, user_id, course_id, assignment_id, game_type, opponent_name, result, points_awarded, player_score, opponent_score, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data;
    },
  });

  const currentQuestion = gameQuestions[round % Math.max(gameQuestions.length, 1)];
  const playerProgress = Math.min(100, playerScore * 25);
  const aiProgress = Math.min(100, aiScore * 25);
  const points = Number(profile?.points ?? 0);
  const rank = points >= 1200 ? "EagleCram Master" : points >= 600 ? "Focus Legend" : points >= 300 ? "Quiz Slayer" : "Rookie Scholar";
  const gameResources = recommendResources(currentQuestion?.topic || studyContext.topic, studyContext.courseName).slice(0, 3);
  const canPlay = Boolean(profile?.id);
  const loadingData = isLoading || coursesLoading || assignmentsLoading;

  const startGame = (game = activeGame) => {
    setActiveGame(game);
    setRound(0);
    setPlayerScore(0);
    setAiScore(0);
    const questionType = game.id === "flashcard_race" ? "flashcards" : "multiple_choice";
    setGameQuestions(
      generateContextQuestions({
        context: studyContext,
        difficulty: game.id === "boss_quiz" ? "hard" : difficulty,
        quizType: questionType,
        count: 6,
      })
    );
    setStartedAt(Date.now());
    setStatus("playing");
    if (studyContext.needsMoreDetail) {
      toast.info("Add notes or details to this assignment to generate better game questions.");
    }
  };

  const finishGame = async (won: boolean, finalPlayerScore: number, finalAiScore: number) => {
    if (!profile?.id) return;
    setSaving(true);
    setStatus(won ? "won" : "lost");

    try {
      const dueSoonBonus =
        selectedAssignment && (isDueToday(selectedAssignment.due_date) || isOverdue(selectedAssignment.due_date, selectedAssignment.status))
          ? 25
          : 0;
      const difficultyBonus = difficulty === "hard" ? 30 : difficulty === "medium" ? 15 : 0;
      const earned = (won ? activeGame.reward : 20) + dueSoonBonus + difficultyBonus;
      const gamePayload = {
        user_id: profile.id,
        course_id: studyContext.courseId,
        assignment_id: studyContext.assignmentId,
        game_type: activeGame.id,
        opponent_name: `${studyContext.courseName} ${activeGame.opponent}`,
        result: won ? "win" : "loss",
        points_awarded: won ? activeGame.reward : 20,
        player_score: finalPlayerScore,
        opponent_score: finalAiScore,
        difficulty,
        score: finalPlayerScore,
        points_earned: earned,
        duration_seconds: startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0,
      };

      const { error: resultError } = await supabase.from("game_results").insert(gamePayload);
      if (resultError) throw resultError;

      const { error: sessionError } = await supabase.from("game_sessions").insert(gamePayload);
      if (sessionError) throw sessionError;

      await awardPoints(
        supabase,
        profile.id,
        earned,
        won ? `Won ${activeGame.title} for ${studyContext.topic}` : `Played ${activeGame.title} for ${studyContext.topic}`,
        "game",
        activeGame.id,
        { courseId: studyContext.courseId, assignmentId: studyContext.assignmentId, activityType: activeGame.id }
      );

      toast.success(won ? `Victory! +${earned} points` : `Good practice. +${earned} points`);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["game_results"] });
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "Could not save game result."));
    } finally {
      setSaving(false);
    }
  };

  const answer = (choice: string) => {
    if (status !== "playing") return;
    if (!currentQuestion) return;
    const accuracyAdjust = difficulty === "hard" ? 12 : difficulty === "easy" ? -10 : 0;
    const aiWillScore = Math.random() * 100 < activeGame.difficulty + accuracyAdjust;
    const nextPlayer = playerScore + (choice === currentQuestion.answer ? 1 : 0);
    const nextAi = aiScore + (aiWillScore ? 1 : 0);
    setPlayerScore(nextPlayer);
    setAiScore(nextAi);

    if (nextPlayer >= 4 || nextAi >= 4 || round >= 4) {
      finishGame(nextPlayer >= nextAi, nextPlayer, nextAi);
      return;
    }

    setRound((value) => value + 1);
  };

  if (loadingData) {
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
              <Gamepad2 className="h-3.5 w-3.5 text-primary" />
              AI opponent arena
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Study Games</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Choose a course or assignment, then battle AI opponents using questions from that material.
            </p>
          </div>
          <Badge className="w-fit gap-1 px-3 py-1.5 text-sm">
            <Coins className="h-4 w-4" />
            {points} points · {rank}
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <AvatarPreview profile={profile} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Study source</CardTitle>
                <CardDescription>Choose course, assignment or entire-course review before starting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Course</Label>
                  <Select value={courseId} onValueChange={(value) => { setCourseId(value); setAssignmentId("course"); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Assignment or scope</Label>
                  <Select value={assignmentId} onValueChange={setAssignmentId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Entire Course</SelectItem>
                      {relevantAssignments.map((assignment) => (
                        <SelectItem key={assignment.id} value={assignment.id}>{assignment.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as QuizDifficulty)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{studyContext.sourceLabel}</p>
                  <p className="mt-1 text-muted-foreground">
                    {studyContext.needsMoreDetail
                      ? "Add notes or details to this assignment to generate better game questions."
                      : `${studyContext.assignments.length} assignment${studyContext.assignments.length === 1 ? "" : "s"} included.`}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Choose a game</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {games.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => startGame(game)}
                    className={`w-full rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-muted ${
                      activeGame.id === game.id ? "border-primary bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{game.title}</span>
                      <Badge variant="outline">{game.reward} pts</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{game.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Swords className="h-5 w-5 text-primary" />
                      {activeGame.title}
                    </CardTitle>
                    <CardDescription>Opponent: {studyContext.courseName} {activeGame.opponent}</CardDescription>
                  </div>
                  <Button onClick={() => startGame(activeGame)} disabled={!canPlay || saving}>
                    {status === "idle" ? "Start game" : "Restart"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>You</span>
                      <span>{playerScore}/4</span>
                    </div>
                    <Progress value={playerProgress} />
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{activeGame.opponent}</span>
                      <span>{aiScore}/4</span>
                    </div>
                    <Progress value={aiProgress} />
                  </div>
                </div>

                {status === "idle" ? (
                  <div className="rounded-xl border bg-muted/40 p-6 text-center">
                    <BrainCircuit className="mx-auto h-10 w-10 text-primary" />
                    <h2 className="mt-3 text-lg font-semibold">Ready to compete?</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Choose a source, pick a game, and answer questions from {studyContext.topic}.
                    </p>
                  </div>
                ) : status === "playing" ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border p-5">
                      <Badge variant="outline" className="mb-3">
                        Round {round + 1}
                      </Badge>
                      <h2 className="text-xl font-semibold">{currentQuestion.prompt}</h2>
                      {currentQuestion.sourceHint && (
                        <p className="mt-2 text-xs text-muted-foreground">{currentQuestion.sourceHint}</p>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(currentQuestion.choices || [currentQuestion.answer, "Review the selected notes first"]).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => answer(choice)}
                          className="rounded-xl border p-4 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border p-6 text-center">
                    {status === "won" ? (
                      <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
                    ) : (
                      <XCircle className="mx-auto h-12 w-12 text-red-500" />
                    )}
                    <h2 className="mt-3 text-xl font-semibold">{status === "won" ? "You won!" : "AI won this round"}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Final score: {playerScore} - {aiScore}
                    </p>
                    {status === "won" && (
                      <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        Reward saved
                      </p>
                    )}
                    {status === "lost" && (
                      <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-left">
                        <p className="text-sm font-medium">Recovery plan</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Review {currentQuestion?.topic || studyContext.topic}, then retry with one focused question set.
                        </p>
                        <div className="mt-3 grid gap-2">
                          {gameResources.map((resource) => (
                            <a
                              key={resource.url}
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border bg-background p-2 text-xs hover:bg-muted"
                            >
                              <span className="font-medium">{resource.title}</span>
                              <span className="ml-2 capitalize text-muted-foreground">{resource.sourceType}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Win/loss history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Play a game to save your first result.</p>
                ) : (
                  gameHistory.map((result) => (
                    <div key={result.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                      <div>
                        <p className="font-medium capitalize">{String(result.game_type).replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">vs {result.opponent_name}</p>
                      </div>
                      <Badge variant={result.result === "win" ? "default" : "secondary"}>
                        {result.result} · +{result.points_awarded}
                      </Badge>
                    </div>
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
