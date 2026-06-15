"use client";

import Link from "next/link";
import { Award, BrainCircuit, CalendarCheck, CheckCircle2, Coins, Flame, Gamepad2, Gift, Lock, Sparkles, Trophy, Wand2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AvatarPreview } from "@/components/avatar/avatar-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/layout/skeletons";
import { useAssignments, useProfile } from "@/lib/hooks/use-assignments";
import { AVATAR_ITEMS, TITLE_UNLOCKS } from "@/lib/rewards";
import { cn } from "@/lib/utils";

const pointRules = [
  { label: "Complete assignment", points: "+50", icon: CheckCircle2 },
  { label: "Complete early", points: "+20 bonus", icon: CalendarCheck },
  { label: "Finish quiz", points: "+30", icon: BrainCircuit },
  { label: "Quiz score 80%+", points: "+25 bonus", icon: Trophy },
  { label: "Perfect quiz", points: "+50 bonus", icon: Award },
  { label: "Win game", points: "+40", icon: Gamepad2 },
  { label: "Daily mission", points: "+75", icon: Gift },
  { label: "Streak day", points: "+10 bonus", icon: Flame },
];

export default function RewardsPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();

  if (profileLoading || assignmentsLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const points = Number(profile?.points ?? 0);
  const streak = Number(profile?.streak_count ?? 0);
  const level = Math.floor(points / 300) + 1;
  const nextLevelAt = level * 300;
  const levelStart = (level - 1) * 300;
  const levelProgress = Math.min(100, Math.round(((points - levelStart) / 300) * 100));
  const completedAssignments = assignments.filter((assignment) => assignment.status === "completed").length;
  const unlockedTitles = new Set(profile?.unlocked_titles ?? ["Rookie Scholar"]);
  const unlockedCosmetics = new Set(profile?.unlocked_cosmetics ?? []);
  const availableUnlocks = AVATAR_ITEMS.filter((item) => !unlockedCosmetics.has(item.id) && points >= item.cost).slice(0, 4);

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Motivation center
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rewards</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Track points, streaks, titles, missions, and avatar unlock progress.
            </p>
          </div>
          <Button asChild>
            <Link href="/avatar">
              <Wand2 className="h-4 w-4" />
              Customize avatar
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <AvatarPreview profile={profile} reaction={streak >= 5 ? "celebrate" : "idle"} />
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Level {level}
              </CardTitle>
              <CardDescription>{points}/{nextLevelAt} points toward the next level.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Progress value={levelProgress} className="h-3" />
              <div className="grid gap-3 sm:grid-cols-3">
                <RewardStat label="Points" value={points} />
                <RewardStat label="Streak" value={`${streak}d`} />
                <RewardStat label="Completed" value={completedAssignments} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily missions</CardTitle>
              <CardDescription>Designed to reward steady progress without encouraging repeat toggles.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Mission title="Finish one assignment" detail="+50 once per assignment" done={completedAssignments > 0} />
              <Mission title="Complete a quiz" detail="+30, reduced on repeats" done={points >= 30} />
              <Mission title="Win a study game" detail="+40 for the first win" done={points >= 40} />
              <Mission title="Study streak check-in" detail="+10 once per day" done={streak > 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How points work</CardTitle>
              <CardDescription>Actions create reward events so the same assignment cannot be farmed forever.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {pointRules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <rule.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{rule.points}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Title unlocks</CardTitle>
              <CardDescription>Equip titles from the Avatar page after unlocking them.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {TITLE_UNLOCKS.map((title) => {
                const unlocked = unlockedTitles.has(title.id) || points >= title.points;
                return (
                  <div key={title.id} className={cn("rounded-xl border p-4", unlocked && "border-primary/40 bg-primary/10")}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{title.id}</p>
                      {unlocked ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{title.rule}</p>
                    <Badge variant="outline" className="mt-3">{title.points} pts</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avatar unlock progress</CardTitle>
              <CardDescription>Spend earned points on professional avatar cosmetics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableUnlocks.length === 0 ? (
                <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Keep earning points to reveal the next set of avatar unlocks.
                </p>
              ) : (
                availableUnlocks.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("h-9 w-9 rounded-lg border", item.color)} />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs capitalize text-muted-foreground">{item.rarity} · {item.category}</p>
                      </div>
                    </div>
                    <Badge>{item.cost} pts</Badge>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/avatar">Open avatar studio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function RewardStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-background/60 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Mission({ title, detail, done }: { title: string; detail: string; done: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4 transition-all", done && "border-primary/40 bg-primary/10")}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{title}</p>
        {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Gift className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

