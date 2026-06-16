"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Pencil, Trash2, BrainCircuit, TrendingUp, Gamepad2, UploadCloud } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CourseForm } from "@/components/courses/course-form";
import { EmptyState } from "@/components/layout/empty-state";
import { Skeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCourses, useAssignments } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CourseInput } from "@/lib/validators/course";
import type { Course } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { isMissingSchemaError } from "@/lib/hooks/use-assignments";
import { ensureUserProfile, showDatabaseSetupToast } from "@/lib/supabase/ensure-profile";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export default function CoursesPage() {
  const { data: courses = [], isLoading } = useCourses();
  const { data: assignments = [] } = useAssignments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const getCourseStats = (courseId: string) => {
    const courseAssignments = assignments.filter((a) => a.course_id === courseId);
    const completed = courseAssignments.filter((a) => a.status === "completed").length;
    const total = courseAssignments.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const upcoming = courseAssignments.filter((a) => a.status !== "completed").slice(0, 2);
    const estimated = courseAssignments
      .filter((a) => a.status !== "completed")
      .reduce((sum, a) => sum + a.estimated_minutes, 0);
    return { total, rate, upcoming, estimated };
  };

  const handleSave = async (data: CourseInput) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      setSaving(false);
      return;
    }

    await ensureUserProfile(supabase, user);

    if (editing) {
      const { error } = await supabase
        .from("courses")
        .update(data)
        .eq("id", editing.id);
      if (error) {
        if (isMissingSchemaError(error)) showDatabaseSetupToast(toast);
        else toast.error(friendlyErrorMessage(error, "Could not update course."));
      }
      else toast.success("Course updated");
    } else {
      const { error } = await supabase.from("courses").insert({ ...data, user_id: user.id });
      if (error) {
        if (isMissingSchemaError(error)) showDatabaseSetupToast(toast);
        else toast.error(friendlyErrorMessage(error, "Could not create course."));
      }
      else toast.success("Course created");
    }

    queryClient.invalidateQueries({ queryKey: ["courses"] });
    setSaving(false);
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Delete "${course.name}"? Assignments will be unlinked.`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) {
      if (isMissingSchemaError(error)) showDatabaseSetupToast(toast);
      else toast.error(friendlyErrorMessage(error, "Could not delete course."));
    }
    else {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
            <p className="mt-1 text-muted-foreground">Track class workload, progress, and study practice.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/import">
                <UploadCloud className="h-4 w-4" /> Import assignments
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/test-me">
                <BrainCircuit className="h-4 w-4" /> Test Me
              </Link>
            </Button>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Add course
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create courses to color-code your calendar and track progress by class."
            actionLabel="Add course"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const stats = getCourseStats(course.id);
              return (
                <Card key={course.id} className="gradient-card overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl"
                          style={{ backgroundColor: `${course.color}20`, borderLeft: `4px solid ${course.color}` }}
                        />
                        <div>
                          <Link href={`/courses/${course.id}`} className="font-semibold hover:underline">
                            {course.name}
                          </Link>
                          {(course.subject || course.teacher) && (
                            <p className="text-sm text-muted-foreground">{course.subject || course.teacher}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditing(course); setDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(course)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                      <span>{stats.total} assignments</span>
                      <span>{stats.rate}% complete</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Progress value={stats.rate} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {stats.estimated} minutes active
                        </span>
                        <span>Performance optional</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Upcoming work</p>
                      {stats.upcoming.length === 0 ? (
                        <p className="rounded-xl border bg-background/60 p-3 text-sm text-muted-foreground">
                          No active assignments for this course.
                        </p>
                      ) : (
                        stats.upcoming.map((assignment) => (
                          <Link
                            key={assignment.id}
                            href={`/assignments/${assignment.id}`}
                            className="block rounded-xl border bg-background/60 p-3 text-sm transition-colors hover:bg-muted"
                          >
                            {assignment.title}
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/import?courseId=${course.id}`}>
                          <UploadCloud className="h-4 w-4" />
                          Import
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/test-me?courseId=${course.id}`}>
                          <BrainCircuit className="h-4 w-4" />
                          Test Me
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/games?courseId=${course.id}`}>
                          <Gamepad2 className="h-4 w-4" />
                          Game
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit course" : "Add course"}</DialogTitle>
          </DialogHeader>
          <CourseForm
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    teacher: editing.teacher || "",
                    subject: editing.subject || "",
                    description: editing.description || "",
                    color: editing.color,
                  }
                : undefined
            }
            onSubmit={handleSave}
            onCancel={() => setDialogOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
