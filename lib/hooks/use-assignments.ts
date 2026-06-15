"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AssignmentWithRelations } from "@/types/database";
import type { AssignmentPriority, AssignmentStatus, Course } from "@/types/database";

export type CalendarAssignment = {
  id: string;
  course_id: string | null;
  title: string;
  due_date: string | null;
  estimated_minutes: number;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  courses?: Pick<Course, "id" | "name" | "color"> | null;
};

export function isMissingSchemaError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

export function useAssignments() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          id,
          user_id,
          course_id,
          title,
          description,
          notes,
          source_type,
          original_input,
          due_date,
          estimated_minutes,
          difficulty,
          priority,
          status,
          grading_weight,
          requirements,
          ai_summary,
          completed_at,
          created_at,
          updated_at,
          courses(id, user_id, name, teacher, subject, description, color, created_at, updated_at),
          assignment_steps(id, assignment_id, step_title, step_description, estimated_minutes, due_date, order_index, is_done, created_at)
        `)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) {
        if (isMissingSchemaError(error)) return [] as AssignmentWithRelations[];
        throw error;
      }
      return data as AssignmentWithRelations[];
    },
  });
}

export function useCalendarAssignments() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["calendar-assignments"],
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          id,
          course_id,
          title,
          due_date,
          estimated_minutes,
          priority,
          status,
          courses(id, name, color)
        `)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) {
        if (isMissingSchemaError(error)) return [] as CalendarAssignment[];
        throw error;
      }
      return data as CalendarAssignment[];
    },
  });
}

export function useAssignment(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["assignments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, courses(*), assignment_steps(*)")
        .eq("id", id)
        .single();

      if (error) {
        if (isMissingSchemaError(error)) return null;
        throw error;
      }
      return data as AssignmentWithRelations;
    },
    enabled: !!id,
  });
}

export function useCourses() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, user_id, name, teacher, subject, description, color, created_at, updated_at")
        .order("name");

      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data;
    },
  });
}

export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error?.code === "PGRST116") {
        const { data: created, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
          })
          .select("*")
          .single();

        if (createError) throw createError;
        return created;
      }

      if (error) {
        if (isMissingSchemaError(error)) return null;
        throw error;
      }
      return data;
    },
  });
}

export function useToggleStep() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ stepId, isDone, assignmentId }: { stepId: string; isDone: boolean; assignmentId: string }) => {
      const { error } = await supabase
        .from("assignment_steps")
        .update({ is_done: isDone })
        .eq("id", stepId);

      if (error) throw error;

      const { data: steps } = await supabase
        .from("assignment_steps")
        .select("is_done")
        .eq("assignment_id", assignmentId);

      const allDone = steps?.every((s) => s.is_done);
      const someDone = steps?.some((s) => s.is_done);

      await supabase
        .from("assignments")
        .update({
          status: allDone ? "completed" : someDone ? "in_progress" : "not_started",
        })
        .eq("id", assignmentId);
    },
    onSuccess: (_, { assignmentId }) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignments", assignmentId] });
    },
  });
}
