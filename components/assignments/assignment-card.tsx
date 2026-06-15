import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "@/components/dashboard/priority-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CourseBadge } from "@/components/dashboard/course-badge";
import { Progress } from "@/components/ui/progress";
import { formatDueDate, formatMinutes, calculateProgress } from "@/lib/utils";
import type { AssignmentWithRelations } from "@/types/database";
import { cleanAssignmentTitle } from "@/lib/assignments/presentation";

type AssignmentCardProps = {
  assignment: AssignmentWithRelations;
  showProgress?: boolean;
};

export function AssignmentCard({ assignment, showProgress = true }: AssignmentCardProps) {
  const steps = assignment.assignment_steps ?? [];
  const progress = calculateProgress(steps);
  const title = cleanAssignmentTitle(assignment.title);

  return (
    <Link href={`/assignments/${assignment.id}`}>
      <Card className="group gradient-card transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={assignment.priority} />
                <StatusBadge status={assignment.status} />
              </div>
              <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CourseBadge course={assignment.courses} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDueDate(assignment.due_date)}
                </span>
                <span>{formatMinutes(assignment.estimated_minutes)} est.</span>
              </div>
              {showProgress && steps.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
