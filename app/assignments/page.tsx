"use client";

import Link from "next/link";
import { Plus, Search, ListTodo } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { EmptyState } from "@/components/layout/empty-state";
import { CardListSkeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignments, useCourses } from "@/lib/hooks/use-assignments";

export default function AssignmentsPage() {
  const { data: assignments = [], isLoading } = useAssignments();
  const { data: courses = [] } = useCourses();
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [status, setStatus] = useState("active");

  const filtered = useMemo(
    () =>
      assignments.filter((assignment) => {
        const queryMatch = `${assignment.title} ${assignment.description || ""} ${assignment.courses?.name || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const courseMatch = courseId === "all" || assignment.course_id === courseId;
        const statusMatch =
          status === "all" ||
          (status === "active" && assignment.status !== "completed") ||
          assignment.status === status;
        return queryMatch && courseMatch && statusMatch;
      }),
    [assignments, courseId, query, status]
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
            <p className="mt-1 text-muted-foreground">Search, filter, and jump into your active work.</p>
          </div>
          <Button asChild>
            <Link href="/assignments/new">
              <Plus className="h-4 w-4" />
              Add assignment
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 rounded-xl border bg-card p-3 md:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assignments..." className="pl-9" />
          </div>
          <Select value={courseId} onValueChange={setCourseId}>
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <CardListSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No assignments found"
            description="Adjust filters or add a new assignment to start planning."
            actionLabel="Add assignment"
            actionHref="/assignments/new"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
