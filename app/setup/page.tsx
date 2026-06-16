import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Database, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SqlCopyBlock } from "@/components/setup/sql-copy-block";

export const metadata = {
  title: "Database Setup | EagleCram",
  description: "Set up the Supabase database tables and Row Level Security policies for EagleCram.",
};

async function readSqlFile(filename: string) {
  return readFile(path.join(process.cwd(), "supabase", filename), "utf8");
}

const setupSteps = [
  "Open Supabase.",
  "Go to SQL Editor.",
  "Click New Query.",
  "Open supabase/full-setup.sql in Cursor.",
  "Copy all of it.",
  "Paste it into Supabase SQL Editor.",
  "Click Run.",
  "Restart the app with npm run dev.",
];

const requiredTables = [
  "profiles",
  "courses",
  "assignments",
  "assignment_notes",
  "quiz_attempts",
  "quiz_questions",
  "missed_questions",
  "game_sessions",
  "reward_events",
  "user_preferences",
  "notifications",
  "study_sessions",
  "avatar_items",
  "user_avatar_items",
  "achievements",
  "study_resources",
  "topic_mastery",
  "flashcards",
  "study_plans",
];

export default async function SetupPage() {
  const [fullSetupSql, schemaSql, policiesSql, learningUpgradeSql] = await Promise.all([
    readSqlFile("full-setup.sql"),
    readSqlFile("schema.sql"),
    readSqlFile("policies.sql"),
    readSqlFile("learning-upgrade.sql"),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" asChild className="w-fit">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
              Open Supabase
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Supabase database setup</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Your app UI is ready, but Supabase needs the tables and security policies before
                courses, assignments, quizzes, games, rewards, and profile progress can save.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run these files in order</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-medium">Recommended: supabase/full-setup.sql</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Creates tables, policies, indexes, triggers, starter data, and the private assignments bucket.
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-medium">Existing app: learning-upgrade.sql</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use this shorter file when only Study, flashcards, mastery, or resource tables are missing.
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-medium">Backup: schema.sql, then policies.sql</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use these two files separately if the full setup file is too large for your SQL Editor.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automatic setup option</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                If you add your Supabase database connection string to <code>.env.local</code> as{" "}
                <code>SUPABASE_DB_URL</code>, this command runs both SQL files for you:
              </p>
              <pre className="overflow-auto rounded-xl border bg-muted/40 p-3 text-xs">
                <code>npm run setup:supabase</code>
              </pre>
              <p>
                Supabase URL, anon key, and service role key are not enough to create tables. The
                database connection string is required for automatic setup.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step-by-step</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {setupSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-xl border p-3 text-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tables this setup creates</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {requiredTables.map((table) => (
                <span key={table} className="rounded-full border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                  {table}
                </span>
              ))}
            </CardContent>
          </Card>

          <SqlCopyBlock title="Recommended: copy and run full-setup.sql" filename="supabase/full-setup.sql" sql={fullSetupSql} />
          <SqlCopyBlock title="Existing app upgrade: copy and run learning-upgrade.sql" filename="supabase/learning-upgrade.sql" sql={learningUpgradeSql} />
          <SqlCopyBlock title="Backup step 1: copy and run schema.sql" filename="supabase/schema.sql" sql={schemaSql} />
          <SqlCopyBlock title="Backup step 2: copy and run policies.sql" filename="supabase/policies.sql" sql={policiesSql} />

          <Card className="border-emerald-500/30 bg-emerald-500/10">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3 text-sm text-emerald-900 dark:text-emerald-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  After both files run successfully, restart the app with <code>npm run dev</code>.
                  The database warning should disappear after Supabase refreshes its schema cache.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
