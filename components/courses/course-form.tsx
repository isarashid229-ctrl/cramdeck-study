"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, type CourseInput } from "@/lib/validators/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Course } from "@/types/database";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6",
];

type CourseFormProps = {
  defaultValues?: Partial<CourseInput>;
  onSubmit: (data: CourseInput) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  course?: Course;
};

export function CourseForm({ defaultValues, onSubmit, onCancel, loading }: CourseFormProps) {
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      teacher: "",
      subject: "",
      description: "",
      color: "#6366f1",
      ...defaultValues,
    },
  });

  const selectedColor = form.watch("color");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Course name</Label>
        <Input className="mt-2" placeholder="e.g. AP Biology" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="mt-1 text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div>
        <Label>Teacher (optional)</Label>
        <Input className="mt-2" placeholder="e.g. Ms. Johnson" {...form.register("teacher")} />
      </div>
      <div>
        <Label>Subject (optional)</Label>
        <Input className="mt-2" placeholder="e.g. Science, Math, English" {...form.register("subject")} />
      </div>
      <div>
        <Label>Description (optional)</Label>
        <Textarea className="mt-2 min-h-20" placeholder="Add class notes, room, links, or grading details..." {...form.register("description")} />
      </div>
      <div>
        <Label>Color</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                selectedColor === color ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => form.setValue("color", color)}
            />
          ))}
        </div>
        <Input type="color" className="mt-2 h-10 w-20" {...form.register("color")} />
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save course"}
        </Button>
      </div>
    </form>
  );
}
