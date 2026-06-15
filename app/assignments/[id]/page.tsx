"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle,
  BrainCircuit,
  BookOpenCheck,
  Gamepad2,
  Trophy,
  CalendarDays,
  Clock,
  ClipboardList,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PriorityBadge } from "@/components/dashboard/priority-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CourseBadge } from "@/components/dashboard/course-badge";
import { StepChecklist } from "@/components/assignments/step-checklist";
import { StudyTimer } from "@/components/assignments/study-timer";
import { Skeleton, CardListSkeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { isMissingSchemaError, useAssignment, useToggleStep } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { formatDueDate, formatMinutes, calculateProgress, isDueToday } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { awardPoints } from "@/lib/rewards";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cleanAssignmentTitle, cleanStudyText, summarizeAssignmentText } from "@/lib/assignments/presentation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: assignment, isLoading } = useAssignment(id);
  const toggleStep = useToggleStep();
  const [userId, setUserId] = useState<string>("");
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [quickDifficulty, setQuickDifficulty] = useState("medium");
  const [quickMode, setQuickMode] = useState("mixed");

  const { data: assignmentActivity = { missed: 0, sessions: 0, points: 0, quizzes: 0, games: 0 } } = useQuery({
    queryKey: ["assignment-activity", id],
    enabled: !!id,
    queryFn: async () => {
      const [missed, sessions, rewards, quizzes, games] = await Promise.all([
        supabase.from("missed_questions").select("id", { count: "exact", head: true }).eq("assignment_id", id).eq("is_reviewed", false),
        supabase.from("study_sessions").select("id", { count: "exact", head: true }).eq("assignment_id", id),
        supabase.from("reward_events").select("points").eq("assignment_id", id),
        supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("assignment_id", id),
        supabase.from("game_results").select("id", { count: "exact", head: true }).eq("assignment_id", id),
      ]);
      if (missed.error && isMissingSchemaError(missed.error)) return { missed: 0, sessions: 0, points: 0, quizzes: 0, games: 0 };
      return {
        missed: missed.count || 0,
        sessions: sessions.count || 0,
        points: (rewards.data || []).reduce((sum, event) => sum + Number(event.points || 0), 0),
        quizzes: quizzes.count || 0,
        games: games.count || 0,
      };
    },
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [supabase.auth]);

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-24 w-full" />
          <CardListSkeleton count={4} />
        </div>
      </DashboardShell>
    );
  }

  if (!assignment) {
    return (
      <DashboardShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Assignment not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const steps = assignment.assignment_steps ?? [];
  const progress = calculateProgress(steps);
  const requirements = Array.isArray(assignment.requirements) ? assignment.requirements : [];

  const handleToggleStep = (stepId: string, isDone: boolean) => {
    toggleStep.mutate({ stepId, isDone, assignmentId: id });
  };

  const handleMarkComplete = async () => {
    await supabase.from("assignments").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("assignment_steps").update({ is_done: true }).eq("assignment_id", id);
    if (userId) {
      try {
        const plannedBonus = isDueToday(assignment.due_date) ? 20 : 0;
        await awardPoints(
          supabase,
          userId,
          50 + plannedBonus,
          plannedBonus ? "Completed planned calendar task" : "Completed assignment",
          plannedBonus ? "calendar" : "assignment",
          id,
          { courseId: assignment.course_id, assignmentId: id, activityType: plannedBonus ? "calendar_completion" : "assignment_completion" }
        );
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        toast.success(`Assignment complete! +${50 + plannedBonus} points`);
      } catch {
        toast.success("Assignment marked complete!");
      }
    } else {
      toast.success("Assignment marked complete!");
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this assignment? This cannot be undone.")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete assignment");
      return;
    }
    toast.success("Assignment deleted");
    router.push("/dashboard");
  };

  const title = cleanAssignmentTitle(assignment.title);
  const displayText = cleanStudyText(assignment.description, assignment.notes, assignment.original_input, assignment.ai_summary);
  const summary = summarizeAssignmentText(cleanStudyText(assignment.ai_summary, assignment.description, assignment.notes, assignment.original_input));
  const nextAction =
    progress === 0
      ? "Start with the first requirement and log a study session."
      : progress < 100
        ? "Finish the next unchecked step, then run a quick quiz."
        : "Assignment is complete. Review missed questions for mastery.";
  const pointsAvailable = assignment.status === "completed" ? 0 : isDueToday(assignment.due_date) ? 70 : 50;
  const quickQuizHref = `/test-me?assignmentId=${id}&difficulty=${quickDifficulty}&mode=${quickMode}`;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <Card className="overflow-hidden border-primary/20 bg-card">
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CourseBadge course={assignment.courses} />
                  <PriorityBadge priority={assignment.priority} />
                  <StatusBadge status={assignment.status} />
                </div>
                <h1 className="max-w-4xl text-2xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    {formatDueDate(assignment.due_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatMinutes(assignment.estimated_minutes)} estimated
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    Difficulty {assignment.difficulty}/5
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleMarkComplete} disabled={assignment.status === "completed"}>
                  <CheckCircle className="h-4 w-4" />
                  Complete
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/study?assignmentId=${id}`}>
                    <BookOpenCheck className="h-4 w-4" />
                    Start studying
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/test-me?assignmentId=${id}`}>
                    <BrainCircuit className="h-4 w-4" />
                    Test Me
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/games?assignmentId=${id}`}>
                    <Gamepad2 className="h-4 w-4" />
                    Play Game
                  </Link>
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/assignments/${id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Completion progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Overview
                </CardTitle>
                <CardDescription>{assignment.courses?.name || "Uncategorized assignment"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{summary}</p>
                {displayText && <p>{displayText}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements checklist</CardTitle>
                <CardDescription>{requirements.length || steps.length} items to verify before submitting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {requirements.length > 0 ? (
                  requirements.map((req, i) => (
                    <div key={req} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                      <Checkbox id={`req-${i}`} className="mt-0.5" />
                      <label htmlFor={`req-${i}`} className="leading-relaxed">{req}</label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No explicit requirements were detected. Use the study plan below.</p>
                )}
              </CardContent>
            </Card>

            <Card id="steps">
              <CardHeader>
                <CardTitle className="text-base">Study plan</CardTitle>
                <CardDescription>Step-by-step work plan with time estimates.</CardDescription>
              </CardHeader>
              <CardContent>
                <StepChecklist steps={steps} onToggle={handleToggleStep} />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {cleanStudyText(assignment.notes, assignment.original_input)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI summary / fallback summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{summary}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Related resources
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Khan Academy", `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(title)}`],
                  ["OpenStax", `https://openstax.org/search?query=${encodeURIComponent(title)}`],
                  ["Crash Course", `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} Crash Course`)}`],
                  ["Study Hub", `/study?assignmentId=${id}`],
                ].map(([label, href]) => (
                  <Button key={label} variant="outline" asChild className="justify-start">
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quiz history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <HistoryRow icon={BrainCircuit} label="Quiz attempts" value={assignmentActivity.quizzes} />
                  <HistoryRow icon={BrainCircuit} label="Missed questions" value={assignmentActivity.missed} />
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/test-me?assignmentId=${id}`}>Review this assignment</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Game history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <HistoryRow icon={Gamepad2} label="Games played" value={assignmentActivity.games} />
                  <HistoryRow icon={Trophy} label="Points earned" value={assignmentActivity.points} />
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/games?assignmentId=${id}`}>Play assignment game</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            {userId && <StudyTimer assignmentId={id} userId={userId} />}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-medium">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Recommended now
                  </div>
                  <p className="text-muted-foreground">{nextAction}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Points available</p>
                    <p className="text-xl font-bold">{pointsAvailable}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Sessions</p>
                    <p className="text-xl font-bold">{assignmentActivity.sessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick quiz setup</CardTitle>
                <CardDescription>Start a focused quiz without visiting setup first.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={quickDifficulty} onValueChange={setQuickDifficulty}>
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
                <Select value={quickMode} onValueChange={setQuickMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                    <SelectItem value="short_answer">Short answer</SelectItem>
                    <SelectItem value="flashcards">Flashcards</SelectItem>
                    <SelectItem value="mistake_review">Mistake review</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full" asChild>
                  <Link href={quickQuizHref}>
                    <BrainCircuit className="h-4 w-4" />
                    Start quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignment details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <HistoryRow icon={Clock} label="Estimated time" value={formatMinutes(assignment.estimated_minutes)} />
                <HistoryRow icon={Target} label="Difficulty" value={`${assignment.difficulty}/5`} />
                <HistoryRow icon={ClipboardList} label="Source" value={assignment.source_type} />
                {assignment.grading_weight && <HistoryRow icon={Trophy} label="Grading weight" value={assignment.grading_weight} />}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

function HistoryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-medium">{value}</span>
    </div>
  );
}
