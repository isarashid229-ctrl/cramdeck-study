import { cn, getPriorityColor } from "@/lib/utils";
import type { AssignmentPriority } from "@/types/database";

export function PriorityBadge({ priority }: { priority: AssignmentPriority }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", getPriorityColor(priority))}>
      {priority}
    </span>
  );
}
