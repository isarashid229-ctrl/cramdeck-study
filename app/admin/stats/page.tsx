"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldAlert, Users, ListTodo, BookOpen, BrainCircuit, Gamepad2, Gift, UserPlus, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/layout/skeletons";

type CountResult = {
  key: string;
  label: string;
  value: number | null;
  error?: string;
};

type AdminStats = {
  serviceRoleConfigured: boolean;
  authUsers: number | null;
  counts: CountResult[];
  assignmentsToday: number;
  activeUsers: number;
  newestUsers: Array<{ id: string; full_name?: string | null; email?: string | null; created_at?: string | null }>;
  recentSignups: Array<{ id: string; full_name?: string | null; email?: string | null; created_at?: string | null }>;
};

const iconMap = {
  profiles: Users,
  courses: BookOpen,
  assignments: ListTodo,
  quiz_attempts: BrainCircuit,
  game_sessions: Gamepad2,
  reward_events: Gift,
};

function formatDate(value?: string | null) {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const basePath = window.location.pathname.startsWith("/cramdeck-study") ? "/cramdeck-study" : "";

    fetch(`${basePath}/api/admin/stats`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load admin stats.");
        return payload as AdminStats;
      })
      .then((payload) => {
        if (mounted) setStats(payload);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError instanceof Error ? requestError.message : "Access denied.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 gap-2">
              <BarChart3 className="h-3.5 w-3.5" />
              Development stats
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin stats</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Private EagleCram usage counts for development checks. Access is limited to emails in ADMIN_EMAILS.
            </p>
          </div>
          {stats && (
            <Badge variant={stats.serviceRoleConfigured ? "default" : "secondary"}>
              {stats.serviceRoleConfigured ? "Service role active" : "Limited by anon policies"}
            </Badge>
          )}
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && !loading && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Access denied
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {stats && !loading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Auth users" value={stats.authUsers ?? "Service role needed"} icon={Users} />
              <StatTile label="Assignments today" value={stats.assignmentsToday} icon={UserPlus} />
              <StatTile label="Active users, 7d" value={stats.activeUsers} icon={Activity} />
              {stats.counts.map((item) => {
                const Icon = iconMap[item.key as keyof typeof iconMap] || BarChart3;
                return <StatTile key={item.key} label={item.label} value={item.value ?? "Unavailable"} icon={Icon} />;
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <UserList title="Newest users" users={stats.newestUsers} />
              <UserList title="Recent signups" users={stats.recentSignups} />
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: number | string; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UserList({
  title,
  users,
}: {
  title: string;
  users: Array<{ id: string; full_name?: string | null; email?: string | null; created_at?: string | null }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Profiles stored in Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No users to show yet.</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.full_name || user.email || "Unnamed user"}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email || user.id}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(user.created_at)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
