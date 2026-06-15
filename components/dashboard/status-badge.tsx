import { cn, getStatusColor } from "@/lib/utils";
import type { AssignmentStatus } from "@/types/database";

const labels: Record<AssignmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", getStatusColor(status))}>
      {labels[status]}
    </span>
  );
}
