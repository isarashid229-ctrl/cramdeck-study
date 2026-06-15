"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { AssignmentReviewForm } from "@/components/assignments/assignment-review-form";
import { isMissingSchemaError, useCourses } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { AIExtractionResult } from "@/types/assignment";
import type { AssignmentReviewInput } from "@/lib/validators/assignment";
import { ensureUserProfile, showDatabaseSetupToast } from "@/lib/supabase/ensure-profile";
import { uploadAssignmentFile } from "@/lib/supabase/storage";
import { cleanAssignmentTitle } from "@/lib/assignments/presentation";

export default function NewAssignmentPage() {
  const router = useRouter();
  const { data: courses = [] } = useCourses();
  const [extracted, setExtracted] = useState<AIExtractionResult | null>(null);
  const [meta, setMeta] = useState<{ source_type: string; original_input: string; file_url?: string; file?: File } | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleExtracted = (
    result: AIExtractionResult,
    extractionMeta: { source_type: string; original_input: string; file_url?: string; file?: File }
  ) => {
    setExtracted(result);
    setMeta(extractionMeta);
  };

  const handleSave = async (data: AssignmentReviewInput) => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setSaving(false);
      return;
    }

    await ensureUserProfile(supabase, user);

    let courseId = data.course_id;

    if (data.course_name && !courseId) {
      const { data: newCourse, error: courseError } = await supabase
        .from("courses")
        .insert({
          user_id: user.id,
          name: data.course_name,
          color: "#6366f1",
        })
        .select("id")
        .single();

      if (courseError) {
        if (isMissingSchemaError(courseError)) showDatabaseSetupToast(toast);
        else toast.error("Failed to create course");
        setSaving(false);
        return;
      }
      courseId = newCourse.id;
    }

    const matchedCourse = courses.find(
      (c) => c.name.toLowerCase() === extracted?.course?.toLowerCase()
    );
    if (!courseId && matchedCourse) {
      courseId = matchedCourse.id;
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .insert({
        user_id: user.id,
        course_id: courseId || null,
        title: cleanAssignmentTitle(data.title),
        description: data.description,
        notes: data.notes || data.original_input || meta?.original_input || "",
        source_type: data.source_type,
        original_input: data.original_input || meta?.original_input || "",
        file_url: data.file_url || meta?.file_url || null,
        due_date: data.due_date || null,
        estimated_minutes: data.estimated_minutes,
        difficulty: data.difficulty,
        priority: data.priority,
        status: "not_started",
        grading_weight: data.grading_weight,
        requirements: data.requirements,
        ai_summary: data.ai_summary,
      })
      .select("id")
      .single();

    if (assignmentError || !assignment) {
      if (assignmentError && isMissingSchemaError(assignmentError)) showDatabaseSetupToast(toast);
      else toast.error(assignmentError?.message || "Failed to save assignment");
      setSaving(false);
      return;
    }

    const steps = data.steps.map((step, index) => ({
      assignment_id: assignment.id,
      step_title: step.step_title,
      step_description: step.step_description,
      estimated_minutes: step.estimated_minutes,
      due_date: step.recommended_due_date || null,
      order_index: index,
      is_done: false,
    }));

    const { error: stepsError } = await supabase.from("assignment_steps").insert(steps);

    if (stepsError) {
      toast.error("Assignment saved but steps failed to create");
    } else {
      toast.success("Assignment created successfully!");
    }

    if (meta?.file) {
      try {
        const fileUrl = await uploadAssignmentFile(meta.file);
        const { error: fileUpdateError } = await supabase
          .from("assignments")
          .update({ file_url: fileUrl })
          .eq("id", assignment.id);

        if (fileUpdateError) {
          toast.warning("Assignment was saved, but the uploaded file link could not be attached.");
        }
      } catch (uploadErr) {
        toast.warning(
          uploadErr instanceof Error
            ? uploadErr.message
            : "Storage policy needs setup. Assignment was saved, but file upload was skipped."
        );
      }
    }

    setSaving(false);
    router.push(`/assignments/${assignment.id}`);
  };

  const reviewDefaults: AssignmentReviewInput | null = extracted
    ? {
        title: cleanAssignmentTitle(extracted.title),
        course_id: courses.find((c) => c.name.toLowerCase() === extracted.course.toLowerCase())?.id || null,
        course_name: extracted.course || "",
        description: extracted.description,
        notes: meta?.original_input || "",
        due_date: extracted.due_date,
        estimated_minutes: extracted.estimated_minutes,
        difficulty: extracted.difficulty,
        priority: extracted.priority,
        requirements: extracted.requirements,
        grading_weight: extracted.grading_weight,
        ai_summary: extracted.ai_summary,
        source_type: meta?.source_type || "paste",
        original_input: meta?.original_input || "",
        file_url: meta?.file_url || null,
        steps: extracted.steps,
      }
    : null;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add assignment</h1>
          <p className="mt-1 text-muted-foreground">
            Paste, upload, or type your assignment — AI will extract the details.
          </p>
        </div>

        {!extracted ? (
          <AssignmentForm onExtracted={handleExtracted} />
        ) : reviewDefaults ? (
          <AssignmentReviewForm
            defaultValues={reviewDefaults}
            courses={courses}
            onSubmit={handleSave}
            onBack={() => {
              setExtracted(null);
              setMeta(null);
            }}
            loading={saving}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
