"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCalendarAssignments, useCourses, type CalendarAssignment } from "@/lib/hooks/use-assignments";
import { Calendar, Clock, Filter, ListChecks, Sparkles } from "lucide-react";
import { CardListSkeleton, Skeleton } from "@/components/layout/skeletons";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cleanAssignmentTitle, formatStudyTime } from "@/lib/assignments/presentation";
import { formatDueDate, isDueToday } from "@/lib/utils";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border bg-card p-4">
        <Skeleton className="mb-4 h-8 w-72 max-w-full" />
        <Skeleton className="h-[540px] w-full" />
      </div>
    ),
  }
);

export default function CalendarPage() {
  const { data: assignments = [], isLoading } = useCalendarAssignments();
  const { data: courses = [] } = useCourses();
  const [courseFilter, setCourseFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("active");

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const courseMatch = courseFilter === "all" || assignment.course_id === courseFilter;
      const priorityMatch = priorityFilter === "all" || assignment.priority === priorityFilter;
      const completionMatch =
        completionFilter === "all" ||
        (completionFilter === "completed" && assignment.status === "completed") ||
        (completionFilter === "active" && assignment.status !== "completed");
      return courseMatch && priorityMatch && completionMatch;
    });
  }, [assignments, completionFilter, courseFilter, priorityFilter]);

  const activeAssignments = useMemo(
    () => filteredAssignments.filter((assignment) => assignment.status !== "completed"),
    [filteredAssignments]
  );
  const today = useMemo(
    () => activeAssignments.filter((assignment) => isDueToday(assignment.due_date)).slice(0, 4),
    [activeAssignments]
  );
  const upcoming = useMemo(() => activeAssignments.slice(0, 6), [activeAssignments]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="mt-1 text-muted-foreground">
              Fast deadline planning with month, week, today, and upcoming views.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:w-auto">
            <div className="rounded-xl border bg-card px-3 py-2">
              <p className="text-lg font-bold">{activeAssignments.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="rounded-xl border bg-card px-3 py-2">
              <p className="text-lg font-bold">{today.length}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="rounded-xl border bg-card px-3 py-2">
              <p className="text-lg font-bold">{filteredAssignments.length}</p>
              <p className="text-xs text-muted-foreground">Shown</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-[auto_1fr_1fr_1fr] md:items-end">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-primary" />
              Filters
            </div>
            <div className="grid gap-2">
              <Label>Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={completionFilter} onValueChange={setCompletionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border bg-card p-4">
              <Skeleton className="mb-4 h-8 w-72 max-w-full" />
              <Skeleton className="h-[540px] w-full" />
            </div>
            <CardListSkeleton count={3} />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No assignments scheduled"
            description="Add assignments with due dates or adjust filters to see them on your calendar."
            actionLabel="Add assignment"
            actionHref="/assignments/new"
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold">Today</h2>
                  </div>
                  {today.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No deadlines due today.</p>
                  ) : (
                    <div className="grid gap-2">
                      {today.map((assignment) => (
                        <CalendarListItem key={assignment.id} assignment={assignment} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <CalendarView assignments={filteredAssignments} />
            </div>
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ListChecks className="h-5 w-5 text-primary" />
                Upcoming
              </h2>
              {upcoming.length === 0 ? (
                <Card>
                  <CardContent className="p-5 text-sm text-muted-foreground">No active deadlines match these filters.</CardContent>
                </Card>
              ) : (
                upcoming.map((assignment) => <CalendarListItem key={assignment.id} assignment={assignment} />)
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function CalendarListItem({ assignment }: { assignment: CalendarAssignment }) {
  return (
    <Link href={`/assignments/${assignment.id}`} className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-medium">{cleanAssignmentTitle(assignment.title)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{assignment.courses?.name || "No course"}</p>
        </div>
        <Badge variant={assignment.priority === "urgent" ? "destructive" : "secondary"} className="shrink-0 capitalize">
          {assignment.priority}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDueDate(assignment.due_date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatStudyTime(assignment.estimated_minutes)}
        </span>
      </div>
    </Link>
  );
}
