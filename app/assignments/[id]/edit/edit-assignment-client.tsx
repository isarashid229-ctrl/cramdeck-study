"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignment, useCourses } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { friendlyErrorMessage } from "@/lib/friendly-error";

const editSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  course_id: z.string().nullable(),
  due_date: z.string().nullable(),
  estimated_minutes: z.coerce.number().int().min(5),
  difficulty: z.coerce.number().int().min(1).max(5),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["not_started", "in_progress", "completed", "overdue"]),
});

type EditInput = z.infer<typeof editSchema>;

export function EditAssignmentClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: assignment, isLoading } = useAssignment(id);
  const { data: courses = [] } = useCourses();
  const supabase = createClient();

  const form = useForm<EditInput>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (assignment) {
      form.reset({
        title: assignment.title,
        description: assignment.description || "",
        course_id: assignment.course_id,
        due_date: assignment.due_date,
        estimated_minutes: assignment.estimated_minutes,
        difficulty: assignment.difficulty,
        priority: assignment.priority,
        status: assignment.status,
      });
    }
  }, [assignment, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.from("assignments").update(values).eq("id", id);
    if (error) {
      toast.error(friendlyErrorMessage(error, "Could not update assignment."));
      return;
    }
    toast.success("Assignment updated");
    router.push(`/assignments/${id}`);
  });

  if (isLoading) {
    return (
      <DashboardShell>
        <LoadingSpinner />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/assignments/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit assignment</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input className="mt-2" {...form.register("title")} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-2" {...form.register("description")} />
              </div>
              <div>
                <Label>Course</Label>
                <Select
                  value={form.watch("course_id") || "none"}
                  onValueChange={(v) => form.setValue("course_id", v === "none" ? null : v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No course</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Due date</Label>
                  <Input type="datetime-local" className="mt-2" {...form.register("due_date")} />
                </div>
                <div>
                  <Label>Est. minutes</Label>
                  <Input type="number" className="mt-2" {...form.register("estimated_minutes")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Difficulty</Label>
                  <Input type="number" min={1} max={5} className="mt-2" {...form.register("difficulty")} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={form.watch("priority")}
                    onValueChange={(v) => form.setValue("priority", v as EditInput["priority"])}
                  >
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["low", "medium", "high", "urgent"] as const).map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v as EditInput["status"])}
                  >
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["not_started", "in_progress", "completed", "overdue"] as const).map((s) => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
