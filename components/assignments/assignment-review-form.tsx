"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentReviewSchema, type AssignmentReviewInput } from "@/lib/validators/assignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import type { Course } from "@/types/database";
import { formatStudyTime } from "@/lib/assignments/presentation";

type AssignmentReviewFormProps = {
  defaultValues: AssignmentReviewInput;
  courses: Course[];
  onSubmit: (data: AssignmentReviewInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
};

export function AssignmentReviewForm({
  defaultValues,
  courses,
  onSubmit,
  onBack,
  loading,
}: AssignmentReviewFormProps) {
  const form = useForm<AssignmentReviewInput>({
    resolver: zodResolver(assignmentReviewSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });
  const estimatedPreview = formatStudyTime(form.watch("estimated_minutes"));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review extracted details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input className="mt-2" {...form.register("title")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Course</Label>
              <Select
                value={form.watch("course_id") || "none"}
                onValueChange={(v) => form.setValue("course_id", v === "none" ? null : v)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                placeholder="Or enter new course name"
                {...form.register("course_name")}
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="datetime-local" className="mt-2" {...form.register("due_date")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Estimated time</Label>
              <Input type="number" className="mt-2" {...form.register("estimated_minutes")} />
              <p className="mt-1 text-xs text-muted-foreground">{estimatedPreview}</p>
            </div>
            <div>
              <Label>Difficulty (1-5)</Label>
              <Input type="number" min={1} max={5} className="mt-2" {...form.register("difficulty")} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as AssignmentReviewInput["priority"])}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["low", "medium", "high", "urgent"] as const).map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea className="mt-2" {...form.register("description")} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-2" placeholder="Any details you want to keep with this assignment..." {...form.register("notes")} />
          </div>
          <div>
            <Label>AI Summary</Label>
            <Textarea className="mt-2" {...form.register("ai_summary")} />
          </div>
          <div>
            <Label>Grading weight</Label>
            <Input className="mt-2" {...form.register("grading_weight")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Task breakdown</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                step_title: "",
                step_description: "",
                estimated_minutes: 30,
                recommended_due_date: null,
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add step
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Step {index + 1}</span>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <Input placeholder="Step title" {...form.register(`steps.${index}.step_title`)} />
                <Textarea placeholder="Description" {...form.register(`steps.${index}.step_description`)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="Minutes"
                    {...form.register(`steps.${index}.estimated_minutes`)}
                  />
                  <Input
                    type="datetime-local"
                    {...form.register(`steps.${index}.recommended_due_date`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save assignment"}
        </Button>
      </div>
    </form>
  );
}
