"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Coins,
  Flame,
  Gamepad2,
  Gift,
  LayoutDashboard,
  ListTodo,
  Lock,
  Plus,
  Sparkles,
  Trophy,
  Wand2,
} from "lucide-react";
import { AvatarPreview } from "@/components/avatar/avatar-preview";
import { ThemeModeToggle } from "@/components/layout/theme-mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoAssignments, demoCourses, demoGames, demoProfile, demoQuizzes, type DemoAssignment } from "@/lib/demo-data";
import { AVATAR_ITEMS, TITLE_UNLOCKS, getAvatarConfig } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const storageKey = "cramdeck-demo-state";
const demoSections = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "assignments", label: "Assignments", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "study", label: "Study Hub", icon: BrainCircuit },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "avatar", label: "Avatar", icon: Wand2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;
const avatarCategories = ["hair", "face", "outfit", "accessory", "background", "effect", "nameplate", "badge", "pet"] as const;
const rarityClass: Record<string, string> = {
  Common: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Uncommon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  Rare: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  Epic: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200",
  Legendary: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
};

type DemoState = {
  points: number;
  streak: number;
  assignments: DemoAssignment[];
  avatar: typeof demoProfile.avatar_config;
  unlockedCosmetics: string[];
  equippedTitle: string;
};

function initialState(): DemoState {
  return {
    points: demoProfile.points,
    streak: demoProfile.streak_count,
    assignments: demoAssignments,
    avatar: demoProfile.avatar_config,
    unlockedCosmetics: demoProfile.unlocked_cosmetics,
    equippedTitle: demoProfile.equipped_title,
  };
}

export default function DemoPage() {
  const [state, setState] = useState<DemoState>(initialState);
  const [active, setActive] = useState<(typeof demoSections)[number]["id"]>("dashboard");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setState({ ...initialState(), ...JSON.parse(saved) });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const profile = useMemo(
    () => ({
      ...demoProfile,
      points: state.points,
      streak_count: state.streak,
      avatar_config: state.avatar,
      unlocked_cosmetics: state.unlockedCosmetics,
      equipped_title: state.equippedTitle,
    }),
    [state]
  );
  const completed = state.assignments.filter((assignment) => assignment.status === "completed").length;
  const activeAssignments = state.assignments.filter((assignment) => assignment.status !== "completed");
  const completionRate = Math.round((completed / state.assignments.length) * 100);
  const nextReward = state.points < 850 ? 850 : state.points < 1200 ? 1200 : 1500;
  const rewardProgress = Math.min(100, Math.round((state.points / nextReward) * 100));
  const avatar = getAvatarConfig(profile);
  const unlockedSet = new Set(state.unlockedCosmetics);

  const completeAssignment = (id: string) => {
    setState((current) => {
      const assignment = current.assignments.find((item) => item.id === id);
      if (!assignment || assignment.status === "completed") return current;
      toast.success("+70 demo points: assignment completed early");
      return {
        ...current,
        points: current.points + 70,
        assignments: current.assignments.map((item) => (item.id === id ? { ...item, status: "completed" } : item)),
      };
    });
  };

  const runDemoQuiz = () => {
    setState((current) => ({ ...current, points: current.points + 55 }));
    toast.success("+55 demo points: quiz completed with an 88%");
  };

  const winDemoGame = () => {
    setState((current) => ({ ...current, points: current.points + 80 }));
    toast.success("+80 demo points: Quiz Duel won");
  };

  const equipDemoItem = (item: (typeof AVATAR_ITEMS)[number]) => {
    const owned = unlockedSet.has(item.id);
    if (!owned && state.points < item.cost) {
      toast.error(`${item.label} needs ${item.cost - state.points} more demo points.`);
      return;
    }
    setState((current) => ({
      ...current,
      points: owned ? current.points : current.points - item.cost,
      unlockedCosmetics: Array.from(new Set([...current.unlockedCosmetics, item.id])),
      avatar: { ...current.avatar, [item.category]: item.id },
    }));
    toast.success(owned ? `${item.label} equipped` : `${item.label} unlocked and equipped`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold">EagleCram Demo</h1>
                <Badge className="gap-1"><Sparkles className="h-3.5 w-3.5" /> Demo Mode</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Explore a realistic student workspace without creating an account.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeModeToggle compact />
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Create account to save progress</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Create an account to save progress.</p>
              <p className="text-sm text-muted-foreground">Demo changes stay on this browser only and never write to Supabase.</p>
            </div>
            <Button asChild>
              <Link href="/auth/signup">Save my own workspace</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <AvatarPreview profile={profile} reaction="celebrate" />
            <Card>
              <CardContent className="grid gap-2 p-3">
                {demoSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActive(section.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all hover:bg-muted",
                      active === section.id && "bg-primary text-primary-foreground shadow-sm"
                    )}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0">
            {active === "dashboard" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat label="Points" value={state.points} icon={Coins} />
                  <Stat label="Study streak" value={`${state.streak}d`} icon={Flame} />
                  <Stat label="Assignments" value={`${completed}/${state.assignments.length}`} icon={ListTodo} />
                  <Stat label="Average quiz" value="84%" icon={BrainCircuit} />
                  <Stat label="Completion" value={`${completionRate}%`} icon={CheckCircle2} />
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recommended next task</CardTitle>
                      <CardDescription>Based on urgency, due dates, and weak topics.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="rounded-xl border bg-muted/40 p-4 text-sm">
                        Finish the introduction and evidence map for <strong>Rhetorical Analysis Essay</strong>, then run a 5-question English check.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button onClick={() => setActive("study")}>Open study plan</Button>
                        <Button variant="outline" onClick={runDemoQuiz}>Try demo quiz</Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Next reward</CardTitle>
                      <CardDescription>{state.points}/{nextReward} points toward Study Beast.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={rewardProgress} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Mission text="Complete 1 assignment" points="+50" />
                        <Mission text="Score 80%+ quiz" points="+25" />
                        <Mission text="Win 1 game" points="+40" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {active === "courses" && (
              <div className="grid gap-4 md:grid-cols-2">
                {demoCourses.map((course) => (
                  <Card key={course.id} className="transition-all hover:-translate-y-1 hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{course.name}</CardTitle>
                          <CardDescription>{course.teacher} · {course.subject}</CardDescription>
                        </div>
                        <span className="h-10 w-10 rounded-xl" style={{ backgroundColor: course.color }} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={course.progress} />
                      <p className="text-sm text-muted-foreground">{course.progress}% complete · {state.assignments.filter((a) => a.courseId === course.id).length} assignments</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {active === "assignments" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Assignments</h2>
                  <Button
                    onClick={() => {
                      setState((current) => ({
                        ...current,
                        points: current.points + 15,
                        assignments: [
                          {
                            id: `demo-added-${Date.now()}`,
                            courseId: "biology",
                            title: "Demo-created Lab Reflection",
                            description: "A temporary demo assignment saved in localStorage.",
                            dueDate: addDaysSafe(6),
                            estimatedMinutes: 30,
                            priority: "medium",
                            status: "not_started",
                          },
                          ...current.assignments,
                        ],
                      }));
                      toast.success("Demo assignment added. +15 first-step points");
                    }}
                  >
                    <Plus className="h-4 w-4" /> Add fake assignment
                  </Button>
                </div>
                <div className="grid gap-3">
                  {state.assignments.map((assignment) => {
                    const course = demoCourses.find((item) => item.id === assignment.courseId);
                    return (
                      <Card key={assignment.id}>
                        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: course?.color }} />
                              <p className="font-medium">{assignment.title}</p>
                              <Badge variant={assignment.priority === "urgent" ? "destructive" : "outline"}>{assignment.priority}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{assignment.description}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {course?.name} · Due {format(parseISO(assignment.dueDate), "MMM d")} · {assignment.estimatedMinutes}m
                            </p>
                          </div>
                          <Button
                            variant={assignment.status === "completed" ? "secondary" : "default"}
                            disabled={assignment.status === "completed"}
                            onClick={() => completeAssignment(assignment.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {assignment.status === "completed" ? "Complete" : "Complete"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {active === "calendar" && (
              <div className="grid gap-4 md:grid-cols-2">
                {activeAssignments.slice(0, 6).map((assignment) => {
                  const course = demoCourses.find((item) => item.id === assignment.courseId);
                  return (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{format(parseISO(assignment.dueDate), "EEEE, MMM d")}</p>
                        <h3 className="mt-1 font-semibold">{assignment.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{course?.name} · {assignment.estimatedMinutes} minute block</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {active === "study" && (
              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Today&apos;s study plan</CardTitle>
                    <CardDescription>Three focused blocks from real demo assignments.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <PlanItem time="20m" text="Review cell transport vocabulary and membrane diagrams." />
                    <PlanItem time="30m" text="Complete quadratic graph shifts: vertex form practice." />
                    <PlanItem time="25m" text="Draft one evidence paragraph for the rhetorical analysis." />
                    <Button onClick={() => setState((current) => ({ ...current, points: current.points + 75 }))}>
                      Complete daily mission +75
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Weak topics</CardTitle>
                    <CardDescription>Demo mastery signals from quizzes and games.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <WeakTopic topic="Quadratic word problem setup" value={54} />
                    <WeakTopic topic="Osmosis vs diffusion" value={68} />
                    <WeakTopic topic="Primary source sourcing" value={72} />
                  </CardContent>
                </Card>
              </div>
            )}

            {active === "games" && (
              <div className="grid gap-4 lg:grid-cols-3">
                {demoGames.map((game) => (
                  <Card key={game.id} className="transition-all hover:-translate-y-1 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base">{game.title}</CardTitle>
                      <CardDescription>vs {game.opponent}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge variant={game.result === "win" ? "default" : "secondary"}>{game.result}</Badge>
                      <p className="text-sm text-muted-foreground">Last reward: +{game.points} points</p>
                      <Button className="w-full" onClick={winDemoGame}>Play demo round</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {active === "rewards" && (
              <RewardsPanel points={state.points} streak={state.streak} rewardProgress={rewardProgress} nextReward={nextReward} />
            )}

            {active === "avatar" && (
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <AvatarPreview profile={profile} reaction="wave" />
                <Card>
                  <CardHeader>
                    <CardTitle>Demo avatar studio</CardTitle>
                    <CardDescription>Unlock and equip cosmetics temporarily with demo points.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="hair">
                      <TabsList className="flex h-auto flex-wrap justify-start">
                      {avatarCategories.map((category) => (
                        <TabsTrigger key={category} value={category} className="capitalize">{category}</TabsTrigger>
                      ))}
                    </TabsList>
                      {avatarCategories.map((category) => (
                        <TabsContent key={category} value={category}>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {AVATAR_ITEMS.filter((item) => item.category === category).map((item) => {
                              const owned = unlockedSet.has(item.id);
                              const equipped = avatar[item.category] === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => equipDemoItem(item)}
                                  className={cn("rounded-xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-md", equipped && "border-primary bg-primary/10")}
                                >
                                  <div className={cn("mb-3 h-12 rounded-xl border", item.color)} />
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">{item.label}</span>
                                    <Badge variant={owned ? "secondary" : "outline"}>{owned ? "Owned" : `${item.cost} pts`}</Badge>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between gap-2">
                                    <Badge className={cn("border-transparent", rarityClass[item.rarity])}>{item.rarity}</Badge>
                                    <span className="text-xs text-muted-foreground">{item.unlock}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {active === "analytics" && (
              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz history</CardTitle>
                    <CardDescription>Recent demo practice scores.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {demoQuizzes.map((quiz) => (
                      <div key={quiz.id} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{quiz.title}</span>
                          <Badge>{quiz.score}%</Badge>
                        </div>
                        <Progress value={quiz.score} className="mt-3" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Course mastery</CardTitle>
                    <CardDescription>Demo progress by class.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {demoCourses.map((course) => (
                      <WeakTopic key={course.id} topic={course.name} value={course.progress} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function addDaysSafe(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Mission({ text, points }: { text: string; points: string }) {
  return (
    <div className="rounded-xl border p-3 text-sm">
      <p className="font-medium">{text}</p>
      <p className="text-muted-foreground">{points}</p>
    </div>
  );
}

function PlanItem({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border p-3">
      <Badge variant="outline">{time}</Badge>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function WeakTopic({ topic, value }: { topic: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{topic}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function RewardsPanel({ points, streak, rewardProgress, nextReward }: { points: number; streak: number; rewardProgress: number; nextReward: number }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Demo points" value={points} icon={Coins} />
        <Stat label="Current streak" value={`${streak}d`} icon={Flame} />
        <Stat label="Next level" value={nextReward} icon={Trophy} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Level progress</CardTitle>
          <CardDescription>Rewards unlock titles, cosmetics, and study status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Progress value={rewardProgress} />
          <div className="grid gap-3 md:grid-cols-2">
            {TITLE_UNLOCKS.slice(0, 8).map((title) => {
              const unlocked = points >= title.points;
              return (
                <div key={title.id} className={cn("rounded-xl border p-4", unlocked ? "bg-primary/10" : "opacity-70")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{title.id}</p>
                    {unlocked ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{title.rule}</p>
                  <Badge variant="outline" className="mt-3">{title.points} pts</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
