"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeModeToggle } from "@/components/layout/theme-mode-toggle";
import { InstallAppButton } from "@/components/layout/install-app-button";
import { requestBrowserNotificationPermission } from "@/lib/notifications/notification-service";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const [defaultDifficulty, setDefaultDifficulty] = useState("medium");
  const [defaultQuestions, setDefaultQuestions] = useState("5");
  const [dailyGoal, setDailyGoal] = useState("45");
  const [dueReminders, setDueReminders] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [streakNudges, setStreakNudges] = useState(true);

  useEffect(() => {
    setDefaultDifficulty(window.localStorage.getItem("cramdeck-default-difficulty") || "medium");
    setDefaultQuestions(window.localStorage.getItem("cramdeck-default-question-count") || "5");
    setDailyGoal(window.localStorage.getItem("cramdeck-daily-study-goal") || "45");
    setDueReminders(window.localStorage.getItem("cramdeck-due-reminders") !== "false");
    setWeeklySummary(window.localStorage.getItem("cramdeck-weekly-summary") === "true");
    setStreakNudges(window.localStorage.getItem("cramdeck-streak-nudges") !== "false");
  }, []);

  const handleExport = () => {
    const payload = {
      quizHistory: JSON.parse(window.localStorage.getItem("cramdeck-quiz-history") || "[]"),
      preferences: { defaultDifficulty, defaultQuestions, dailyGoal },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cramdeck-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Data export downloaded");
  };

  const saveStudyPrefs = () => {
    window.localStorage.setItem("cramdeck-default-difficulty", defaultDifficulty);
    window.localStorage.setItem("cramdeck-default-question-count", defaultQuestions);
    window.localStorage.setItem("cramdeck-daily-study-goal", dailyGoal);
    toast.success("Study preferences saved");
  };

  const saveNotificationPref = (key: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value);
    window.localStorage.setItem(key, String(value));
    toast.success("Notification preference saved");
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your study experience, appearance, and data.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Install app</CardTitle>
              <CardDescription>Use EagleCram from your dock, desktop, or mobile home screen.</CardDescription>
            </CardHeader>
            <CardContent>
              <InstallAppButton className="w-full sm:w-auto" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Update your name, school, grade level, and timezone.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/profile">Edit profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Use light, dark, or your system preference.</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeModeToggle />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Manage deadline reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Due date reminders</Label>
              <Switch
                checked={dueReminders}
                onCheckedChange={(value) => saveNotificationPref("cramdeck-due-reminders", value, setDueReminders)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Weekly summary email</Label>
              <Switch
                checked={weeklySummary}
                onCheckedChange={(value) => saveNotificationPref("cramdeck-weekly-summary", value, setWeeklySummary)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Study streak nudges</Label>
              <Switch
                checked={streakNudges}
                onCheckedChange={(value) => saveNotificationPref("cramdeck-streak-nudges", value, setStreakNudges)}
              />
            </div>
            <Button variant="outline" asChild>
              <Link href="/notifications">View notifications</Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const permission = await requestBrowserNotificationPermission();
                if (permission === "granted") toast.success("Browser notifications enabled");
                else if (permission === "denied") toast.error("Notifications are blocked in this browser.");
                else toast.info("Browser notifications are not supported here.");
              }}
            >
              Enable browser notifications
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study preferences</CardTitle>
            <CardDescription>Set defaults used by Test Me and study planning.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Default difficulty</Label>
              <Select value={defaultDifficulty} onValueChange={setDefaultDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="default-questions">Quiz questions</Label>
              <Input
                id="default-questions"
                type="number"
                min={1}
                value={defaultQuestions}
                onChange={(event) => setDefaultQuestions(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="daily-goal">Daily study goal</Label>
              <Input
                id="daily-goal"
                type="number"
                min={5}
                value={dailyGoal}
                onChange={(event) => setDailyGoal(event.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <Button onClick={saveStudyPrefs}>Save preferences</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data and privacy</CardTitle>
            <CardDescription>Export local quiz history and preferences. Supabase data remains protected by RLS.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>Export data</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.localStorage.removeItem("cramdeck-quiz-history");
                toast.success("Local quiz history cleared");
              }}
            >
              Clear local quiz history
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
