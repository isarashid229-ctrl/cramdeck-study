"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit, CalendarDays, Gamepad2, ListTodo, Target, Timer, UploadCloud } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Skeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAssignments, useCourses } from "@/lib/hooks/use-assignments";
import { formatMinutes, isDueToday, isOverdue } from "@/lib/utils";

export function CourseDetailClient({ id }: { id: string }) {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const course = courses.find((item) => item.id === id);
  const courseAssignments = assignments.filter((assignment) => assignment.course_id === id);
  const active = courseAssignments.filter((assignment) => assignment.status !== "completed");
  const completed = courseAssignments.filter((assignment) => assignment.status === "completed");
  const overdue = active.filter((assignment) => isOverdue(assignment.due_date, assignment.status));
  const today = active.filter((assignment) => isDueToday(assignment.due_date));
  const completionRate = courseAssignments.length ? Math.round((completed.length / courseAssignments.length) * 100) : 0;
  const activeMinutes = active.reduce((sum, assignment) => sum + assignment.estimated_minutes, 0);
  const weakTopic = active[0]?.title || "Recent missed questions";

  if (coursesLoading || assignmentsLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!course) {
    return (
      <DashboardShell>
        <EmptyState
          icon={ListTodo}
          title="Course not found"
          description="The course may have been deleted, or it may not be synced to this account yet."
          actionLabel="Back to courses"
          actionHref="/courses"
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button variant="ghost" asChild className="-ml-3 mb-2">
              <Link href="/courses">
                <ArrowLeft className="h-4 w-4" />
                Courses
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 rounded-2xl" style={{ backgroundColor: course.color }} />
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.name}</h1>
                <p className="mt-1 text-muted-foreground">{course.subject || course.teacher || "Course dashboard"}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/import?courseId=${course.id}`}>
                <UploadCloud className="h-4 w-4" />
                Import assignments
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/test-me?courseId=${course.id}`}>
                <BrainCircuit className="h-4 w-4" />
                Start quiz
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/games?courseId=${course.id}`}>
                <Gamepad2 className="h-4 w-4" />
                Play game
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <CourseStat icon={ListTodo} label="Assignments" value={courseAssignments.length} />
          <CourseStat icon={Target} label="Complete" value={`${completionRate}%`} />
          <CourseStat icon={CalendarDays} label="Due today" value={today.length} />
          <CourseStat icon={Timer} label="Active work" value={formatMinutes(activeMinutes)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming assignments</CardTitle>
                <CardDescription>What needs attention next in {course.name}.</CardDescription>
              </CardHeader>
              <CardContent>
                {active.length === 0 ? (
                  <EmptyState
                    icon={ListTodo}
                    title="No active assignments"
                    description="Import or create assignments for this course to build a study plan."
                    actionLabel="Import assignments"
                    actionHref={`/import?courseId=${course.id}`}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {active.slice(0, 6).map((assignment) => (
                      <AssignmentCard key={assignment.id} assignment={assignment} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {overdue.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Behind or urgent</CardTitle>
                  <CardDescription>Start here to recover momentum.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {overdue.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course progress</CardTitle>
                <CardDescription>{completed.length} of {courseAssignments.length} assignments complete.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={completionRate} />
                <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                  <p className="font-medium">Suggested next action</p>
                  <p className="mt-1 text-muted-foreground">
                    {active[0] ? `Review ${active[0].title}, then run a quick quiz.` : "Import the next assignment or review old quiz misses."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weak and strong topics</CardTitle>
                <CardDescription>Generated from assignments, quizzes, and game history.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TopicBar label={`Weak: ${weakTopic}`} value={48} />
                <TopicBar label="Strong: course organization" value={82} />
                <TopicBar label="Mastery trend" value={completionRate || 35} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function CourseStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TopicBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

