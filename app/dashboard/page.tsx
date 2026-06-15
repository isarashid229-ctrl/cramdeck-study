"use client";

import Link from "next/link";
import { format, parseISO, startOfWeek, addDays, isSameDay } from "date-fns";
import {
  Plus,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  BrainCircuit,
  BookOpen,
  Flame,
  Lightbulb,
  Coins,
  Gamepad2,
  Wand2,
  Trophy,
  BookOpenCheck,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { EmptyState } from "@/components/layout/empty-state";
import { DashboardSkeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarPreview } from "@/components/avatar/avatar-preview";
import { InstallAppButton } from "@/components/layout/install-app-button";
import { useAssignments, useProfile } from "@/lib/hooks/use-assignments";
import { getGreeting, filterAssignmentsByStats, isDueToday, isOverdue, formatMinutes } from "@/lib/utils";

export default function DashboardPage() {
  const { data: assignments = [], isLoading } = useAssignments();
  const { data: profile } = useProfile();

  if (isLoading) {
    return (
      <DashboardShell>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  const stats = filterAssignmentsByStats(assignments);
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const points = Number(profile?.points ?? 0);
  const nextRewardAt = points < 150 ? 150 : points < 300 ? 300 : points < 600 ? 600 : points < 1200 ? 1200 : points + 500;
  const rewardProgress = Math.min(100, Math.round((points / nextRewardAt) * 100));

  const urgent = assignments.filter(
    (a) => a.priority === "urgent" && a.status !== "completed"
  );
  const today = assignments.filter((a) => a.status !== "completed" && isDueToday(a.due_date));
  const overdue = assignments.filter((a) => isOverdue(a.due_date, a.status));
  const upcoming = assignments
    .filter((a) => a.status !== "completed")
    .slice(0, 5);
  const activeAssignments = assignments.filter((a) => a.status !== "completed");
  const totalStudyMinutes = activeAssignments.reduce((sum, a) => sum + (a.estimated_minutes || 0), 0);
  const studyStreak = Math.min(7, Math.max(1, stats.completed + today.length));

  const weekStart = startOfWeek(new Date());
  const weeklyWorkload = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    const minutes = activeAssignments
      .filter((assignment) => assignment.due_date && isSameDay(parseISO(assignment.due_date), day))
      .reduce((sum, assignment) => sum + assignment.estimated_minutes, 0);
    return { label: format(day, "EEE"), minutes };
  });
  const maxDailyMinutes = Math.max(...weeklyWorkload.map((day) => day.minutes), 60);

  const priorityBreakdown = ["urgent", "high", "medium", "low"].map((priority) => ({
    priority,
    count: activeAssignments.filter((a) => a.priority === priority).length,
  }));

  const suggestion =
    overdue.length > 0
      ? `Start with ${overdue[0].title}; it is overdue and needs the quickest recovery plan.`
      : today.length > 0
        ? `Block ${formatMinutes(today[0].estimated_minutes)} today for ${today[0].title}.`
        : urgent.length > 0
          ? `Use Test Me on ${urgent[0].title} before you begin the final pass.`
          : activeAssignments.length > 0
            ? `Choose one upcoming assignment and finish the smallest next step first.`
            : "You are clear for now. Add your next assignment when it arrives.";
  const recommendedAssignment = overdue[0] || today[0] || urgent[0] || activeAssignments[0];

  const courseProgress = Object.values(
    assignments.reduce<Record<string, { name: string; color: string; total: number; done: number }>>(
      (acc, a) => {
        const key = a.course_id || "none";
        if (!acc[key]) {
          acc[key] = {
            name: a.courses?.name || "Uncategorized",
            color: a.courses?.color || "#94a3b8",
            total: 0,
            done: 0,
          };
        }
        acc[key].total++;
        if (a.status === "completed") acc[key].done++;
        return acc;
      },
      {}
    )
  );

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {getGreeting()}, {profile?.full_name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your study plan, rewards, avatar, and practice tools in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <InstallAppButton />
            <Button asChild>
              <Link href="/assignments/new">
                <Plus className="h-4 w-4" />
                Add assignment
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/test-me">
                <BrainCircuit className="h-4 w-4" />
                Test me
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total assignments" value={stats.total} icon={ListTodo} />
          <StatCard title="Points" value={points} icon={Coins} variant="success" />
          <StatCard title="Overdue" value={stats.overdue} icon={AlertTriangle} variant="danger" />
          <StatCard title="Due today" value={stats.dueToday} icon={CalendarDays} variant="warning" />
          <StatCard title="Study streak" value={`${studyStreak}d`} icon={Flame} variant="success" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-12 justify-start" asChild>
            <Link href="/assignments/new">
              <Plus className="h-4 w-4" />
              Add Assignment
            </Link>
          </Button>
          <Button variant="outline" className="h-12 justify-start" asChild>
            <Link href="/test-me">
              <BrainCircuit className="h-4 w-4" />
              Test Me
            </Link>
          </Button>
          <Button variant="outline" className="h-12 justify-start" asChild>
            <Link href="/study">
              <BookOpenCheck className="h-4 w-4" />
              Study
            </Link>
          </Button>
          <Button variant="outline" className="h-12 justify-start" asChild>
            <Link href="/games">
              <Gamepad2 className="h-4 w-4" />
              Games
            </Link>
          </Button>
          <Button variant="outline" className="h-12 justify-start" asChild>
            <Link href="/avatar">
              <Wand2 className="h-4 w-4" />
              Avatar
            </Link>
          </Button>
          <Button variant="outline" className="h-12 justify-start" asChild>
            <Link href="/calendar">
              <CalendarDays className="h-4 w-4" />
              View Calendar
            </Link>
          </Button>
          <Button variant="outline" className="h-12 justify-start" asChild>
            <Link href="/courses">
              <BookOpen className="h-4 w-4" />
              Add Course
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <AvatarPreview profile={profile} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-primary" />
                Daily reward goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Progress toward next reward</span>
                  <span>{points}/{nextRewardAt}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${rewardProgress}%` }} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Finish one task</p>
                  <p className="text-muted-foreground">+50 points</p>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Complete a quiz</p>
                  <p className="text-muted-foreground">+40 points</p>
                </div>
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Win a game</p>
                  <p className="text-muted-foreground">+65 to +120 points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="gradient-card lg:col-span-1">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <ProgressRing value={completionRate} label="complete" />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {stats.completed} of {stats.total} assignments completed
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Progress by course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses yet. Add assignments to see progress.</p>
              ) : (
                courseProgress.map((course) => {
                  const pct = course.total > 0 ? Math.round((course.done / course.total) * 100) : 0;
                  return (
                    <div key={course.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: course.color }} />
                          {course.name}
                        </span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: course.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Weekly workload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weeklyWorkload.map((day) => (
                  <div key={day.label} className="space-y-2">
                    <div className="flex h-28 items-end rounded-xl bg-muted p-1">
                      <div
                        className="w-full rounded-lg bg-primary transition-all"
                        style={{ height: `${Math.max(8, (day.minutes / maxDailyMinutes) * 100)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">{day.label}</p>
                      <p className="text-[11px] text-muted-foreground">{day.minutes}m</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI study suggestion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 rounded-xl border bg-muted/40 p-4">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">{suggestion}</p>
              </div>
              {recommendedAssignment && (
                <div className="rounded-xl border p-3">
                  <p className="text-sm font-medium">Recommended assignment</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{recommendedAssignment.title}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/test-me?assignmentId=${recommendedAssignment.id}`}>
                        <BrainCircuit className="h-4 w-4" />
                        Test Me
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/games?assignmentId=${recommendedAssignment.id}`}>
                        <Gamepad2 className="h-4 w-4" />
                        Game
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active workload</span>
                  <span>{formatMinutes(totalStudyMinutes)}</span>
                </div>
                {priorityBreakdown.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {item.priority}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-primary" />
            Today
          </h2>
          {today.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No assignments due today. Use the breathing room to study ahead or run a quick practice quiz.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {today.map((a) => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          )}
        </section>

        {urgent.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Urgent assignments
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {urgent.map((a) => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Upcoming timeline
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No upcoming assignments"
              description="You're all caught up! Add a new assignment to get started with structured planning."
              actionLabel="Add assignment"
              actionHref="/assignments/new"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcoming.map((a) => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
