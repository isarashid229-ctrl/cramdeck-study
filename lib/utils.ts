import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  differenceInHours,
  differenceInDays,
  isPast,
  isToday,
  isThisWeek,
  parseISO,
  format,
  formatDistanceToNow,
} from "date-fns";
import type { Assignment, AssignmentPriority, AssignmentStatus } from "@/types/database";
import { formatStudyTime } from "@/lib/assignments/presentation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDueDate(date: string | null): string {
  if (!date) return "No due date";
  const parsed = parseISO(date);
  if (isToday(parsed)) return `Today at ${format(parsed, "h:mm a")}`;
  return format(parsed, "MMM d, yyyy 'at' h:mm a");
}

export function formatShortDate(date: string | null): string {
  if (!date) return "—";
  return format(parseISO(date), "MMM d");
}

export function formatRelativeDate(date: string | null): string {
  if (!date) return "No deadline";
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function computePriority(
  dueDate: string | null,
  difficulty: number,
  estimatedMinutes: number
): AssignmentPriority {
  if (!dueDate) return "medium";

  const due = parseISO(dueDate);
  const now = new Date();
  const hoursUntilDue = differenceInHours(due, now);
  const daysUntilDue = differenceInDays(due, now);

  if (isPast(due) || hoursUntilDue <= 24) return "urgent";
  if (difficulty >= 4 && daysUntilDue <= 3) return "urgent";
  if (daysUntilDue <= 3 || estimatedMinutes >= 180) return "high";
  if (daysUntilDue <= 7) return "medium";
  return "low";
}

export function computeStatus(
  dueDate: string | null,
  currentStatus: AssignmentStatus,
  progressPercent: number
): AssignmentStatus {
  if (currentStatus === "completed") return "completed";
  if (dueDate && isPast(parseISO(dueDate)) && progressPercent < 100) return "overdue";
  if (progressPercent > 0 && progressPercent < 100) return "in_progress";
  return currentStatus === "overdue" ? "overdue" : "not_started";
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function sanitizeText(input: string, maxLength = 50000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function calculateProgress(steps: { is_done: boolean }[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.is_done).length;
  return Math.round((done / steps.length) * 100);
}

export function isDueToday(date: string | null): boolean {
  if (!date) return false;
  return isToday(parseISO(date));
}

export function isDueThisWeek(date: string | null): boolean {
  if (!date) return false;
  return isThisWeek(parseISO(date), { weekStartsOn: 0 });
}

export function isOverdue(date: string | null, status: AssignmentStatus): boolean {
  if (status === "completed") return false;
  if (!date) return false;
  return isPast(parseISO(date));
}

export function formatMinutes(minutes: number): string {
  return formatStudyTime(minutes);
}

export function getPriorityColor(priority: AssignmentPriority): string {
  const colors: Record<AssignmentPriority, string> = {
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return colors[priority];
}

export function getStatusColor(status: AssignmentStatus): string {
  const colors: Record<AssignmentStatus, string> = {
    not_started: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[status];
}

export function filterAssignmentsByStats(assignments: Assignment[]) {
  const active = assignments.filter((a) => a.status !== "completed");
  return {
    total: assignments.length,
    overdue: active.filter((a) => isOverdue(a.due_date, a.status)).length,
    dueToday: active.filter((a) => isDueToday(a.due_date)).length,
    dueThisWeek: active.filter((a) => isDueThisWeek(a.due_date)).length,
    completed: assignments.filter((a) => a.status === "completed").length,
  };
}
