import type { Course } from "@/types/database";

export function CourseBadge({ course }: { course?: Course | null }) {
  if (!course) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        No course
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: course.color }} />
      {course.name}
    </span>
  );
}
