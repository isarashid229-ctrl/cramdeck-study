"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { format, subDays, isThisWeek, parseISO } from "date-fns";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton, StatCardSkeleton } from "@/components/layout/skeletons";
import { isMissingSchemaError, useAssignments } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, BrainCircuit, Flame } from "lucide-react";
import { isOverdue } from "@/lib/utils";
import type { StudySession } from "@/types/database";
import type { QuizResult } from "@/lib/quiz/types";

const AnalyticsChartCard = dynamic(
  () => import("@/components/analytics/analytics-chart-card").then((mod) => mod.AnalyticsChartCard),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border bg-card p-6">
        <Skeleton className="mb-4 h-5 w-44" />
        <Skeleton className="h-[260px] w-full" />
      </div>
    ),
  }
);

export default function AnalyticsPage() {
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const supabase = createClient();

  useEffect(() => {
    try {
      setQuizHistory(JSON.parse(window.localStorage.getItem("cramdeck-quiz-history") || "[]"));
    } catch {
      setQuizHistory([]);
    }
  }, []);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["study_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("id, user_id, assignment_id, started_at, ended_at, minutes, notes")
        .order("started_at", { ascending: false });
      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data as StudySession[];
    },
  });

  const analytics = useMemo(() => {
    const completedThisWeek = assignments.filter(
      (a) => a.status === "completed" && isThisWeek(parseISO(a.updated_at))
    ).length;

    const overdueCount = assignments.filter(
      (a) => isOverdue(a.due_date, a.status)
    ).length;

    const completedWithTime = assignments.filter((a) => a.status === "completed");
    const avgMinutes =
      completedWithTime.length > 0
        ? Math.round(
            completedWithTime.reduce((sum, a) => sum + a.estimated_minutes, 0) /
              completedWithTime.length
          )
        : 0;

    const studyByDay = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, "EEE");
      const minutes = sessions
        .filter((s) => s.started_at && format(parseISO(s.started_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
        .reduce((sum, s) => sum + (s.minutes || 0), 0);
      return { name: dateStr, minutes };
    });

    const byCourse = Object.values(
      assignments.reduce<Record<string, { name: string; count: number }>>((acc, a) => {
        const name = a.courses?.name || "Uncategorized";
        if (!acc[name]) acc[name] = { name, count: 0 };
        acc[name].count++;
        return acc;
      }, {})
    );

    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pending = total - completed;
    const completionSplit = [
      { name: "Completed", count: completed },
      { name: "Pending", count: pending },
    ];

    const overdueTrend = Array.from({ length: 4 }, (_, i) => ({
      name: `Week ${i + 1}`,
      overdue: Math.max(0, overdueCount - i),
    }));

    const quizScores = quizHistory
      .slice(0, 7)
      .reverse()
      .map((attempt, index) => ({
        name: `Quiz ${index + 1}`,
        score: attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0,
      }));

    const hardestSubjects = Object.values(
      assignments.reduce<Record<string, { name: string; urgent: number; total: number }>>((acc, assignment) => {
        const name = assignment.courses?.name || "Uncategorized";
        if (!acc[name]) acc[name] = { name, urgent: 0, total: 0 };
        acc[name].total++;
        if (assignment.priority === "urgent" || isOverdue(assignment.due_date, assignment.status)) acc[name].urgent++;
        return acc;
      }, {})
    ).sort((a, b) => b.urgent - a.urgent);

    return {
      completedThisWeek,
      avgMinutes,
      overdueCount,
      studyByDay,
      byCourse,
      productivityScore,
      completionSplit,
      overdueTrend,
      quizScores,
      hardestSubjects,
    };
  }, [assignments, quizHistory, sessions]);

  if (assignmentsLoading || sessionsLoading) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-card p-6">
                <Skeleton className="mb-4 h-5 w-44" />
                <Skeleton className="h-[260px] w-full" />
              </div>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productivity Analytics</h1>
          <p className="mt-1 text-muted-foreground">Track your study habits and assignment trends.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Completed this week"
            value={analytics.completedThisWeek}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Avg. completion time"
            value={`${analytics.avgMinutes}m`}
            icon={Clock}
          />
          <StatCard
            title="Overdue"
            value={analytics.overdueCount}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Productivity score"
            value={`${analytics.productivityScore}%`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Saved quizzes"
            value={quizHistory.length}
            icon={BrainCircuit}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnalyticsChartCard
            title="Completed vs pending"
            type="pie"
            data={analytics.completionSplit}
            dataKey="count"
            colors={["#22c55e", "#f97316"]}
          />
          <AnalyticsChartCard
            title="Study minutes by day"
            description="Last 7 days of logged study time"
            type="bar"
            data={analytics.studyByDay}
            dataKey="minutes"
          />
          <AnalyticsChartCard
            title="Assignments by course"
            type="pie"
            data={analytics.byCourse}
            dataKey="count"
          />
          <AnalyticsChartCard
            title="Quiz scores over time"
            description="Saved Test Me attempts from this browser"
            type="line"
            data={analytics.quizScores.length ? analytics.quizScores : [{ name: "No quizzes", score: 0 }]}
            dataKey="score"
          />
          <AnalyticsChartCard
            title="Overdue trends"
            description="Weekly overdue assignment count"
            type="line"
            data={analytics.overdueTrend}
            dataKey="overdue"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Flame className="h-4 w-4 text-primary" />
              Hardest subjects
            </h2>
            <div className="mt-4 space-y-3">
              {analytics.hardestSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add assignments to see subject difficulty insights.</p>
              ) : (
                analytics.hardestSubjects.slice(0, 5).map((subject) => (
                  <div key={subject.name} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                    <span>{subject.name}</span>
                    <span className="text-muted-foreground">{subject.urgent} high-pressure items</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Productivity insight</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {analytics.overdueCount > 0
                ? "Your best move is to clear overdue work before adding more study blocks."
                : analytics.productivityScore >= 80
                  ? "You are keeping a strong completion pace. Keep using short quizzes before deadlines."
                  : "Focus on one course at a time and use Test Me after each completed step."}
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
