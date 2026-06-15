"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { formatMinutes, formatShortDate } from "@/lib/utils";
import type { AssignmentStep } from "@/types/database";

type StepChecklistProps = {
  steps: AssignmentStep[];
  onToggle?: (stepId: string, isDone: boolean) => void;
  readOnly?: boolean;
};

export function StepChecklist({ steps, onToggle, readOnly }: StepChecklistProps) {
  const sorted = [...steps].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-3">
      {sorted.map((step, index) => (
        <div
          key={step.id}
          className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30"
        >
          <Checkbox
            id={step.id}
            checked={step.is_done}
            disabled={readOnly}
            onCheckedChange={(checked) => onToggle?.(step.id, checked === true)}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <label
              htmlFor={step.id}
              className={`block font-medium ${step.is_done ? "text-muted-foreground line-through" : ""}`}
            >
              {index + 1}. {step.step_title}
            </label>
            {step.step_description && (
              <p className="mt-1 text-sm text-muted-foreground">{step.step_description}</p>
            )}
            <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
              <span>{formatMinutes(step.estimated_minutes)}</span>
              {step.due_date && <span>Due {formatShortDate(step.due_date)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
