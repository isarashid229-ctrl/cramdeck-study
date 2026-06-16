"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ClipboardPaste,
  Cloud,
  FileUp,
  GraduationCap,
  Mail,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { AssignmentReviewForm } from "@/components/assignments/assignment-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isMissingSchemaError, useCourses } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { quickImportDraftKey } from "@/components/layout/quick-add-dialog";
import { cleanAssignmentTitle } from "@/lib/assignments/presentation";
import { ensureUserProfile, showDatabaseSetupToast } from "@/lib/supabase/ensure-profile";
import { uploadAssignmentFile } from "@/lib/supabase/storage";
import { fallbackAssignmentExtraction } from "@/lib/assignments/fallback-extraction";
import type { AIExtractionResult } from "@/types/assignment";
import type { AssignmentReviewInput } from "@/lib/validators/assignment";
import { toast } from "sonner";

const schoolIntegrations = [
  { name: "Google Classroom", status: "Ready to connect", auth: "Google OAuth", accent: "bg-emerald-500" },
  { name: "Canvas", status: "Institution login", auth: "Canvas API", accent: "bg-red-500" },
  { name: "Schoology", status: "Connector planned", auth: "Schoology API", accent: "bg-sky-500" },
  { name: "Blackboard", status: "Connector planned", auth: "REST + school URL", accent: "bg-slate-700" },
  { name: "Moodle", status: "Connector planned", auth: "Moodle web services", accent: "bg-orange-500" },
  { name: "Teams Education", status: "Connector planned", auth: "Microsoft Graph", accent: "bg-indigo-500" },
  { name: "PowerSchool", status: "Research mode", auth: "School district dependent", accent: "bg-violet-500" },
];

const emailIntegrations = [
  { name: "Gmail", status: "Detect teacher announcements", auth: "Google OAuth" },
  { name: "Outlook", status: "Detect assignments and calendar messages", auth: "Microsoft Graph" },
];

type Draft = { source_type: "paste" | "manual"; text: string; created_at?: string };

export default function ImportPage() {
  const router = useRouter();
  const supabase = createClient();
  const { data: courses = [] } = useCourses();
  const [quickDraft, setQuickDraft] = useState<Draft | null>(null);
  const [extractingDraft, setExtractingDraft] = useState(false);
  const [extracted, setExtracted] = useState<AIExtractionResult | null>(null);
  const [meta, setMeta] = useState<{ source_type: string; original_input: string; file_url?: string; file?: File } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadDraft = () => {
      const raw = window.localStorage.getItem(quickImportDraftKey);
      if (raw) setQuickDraft(JSON.parse(raw));
    };
    const handleDraft = (event: Event) => {
      const detail = (event as CustomEvent<Draft>).detail;
      if (detail) setQuickDraft(detail);
      else loadDraft();
    };
    loadDraft();
    window.addEventListener("cramdeck-quick-import", handleDraft);
    return () => window.removeEventListener("cramdeck-quick-import", handleDraft);
  }, []);

  const handleExtracted = (
    result: AIExtractionResult,
    extractionMeta: { source_type: string; original_input: string; file_url?: string; file?: File }
  ) => {
    setExtracted(result);
    setMeta(extractionMeta);
  };

  const analyzeQuickDraft = async () => {
    if (!quickDraft) return;
    setExtractingDraft(true);
    try {
      const response = await fetch("/api/ai/extract-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: quickDraft.source_type, text: quickDraft.text }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const fallback = fallbackAssignmentExtraction(quickDraft.text);
        setExtracted(fallback);
        setMeta({ source_type: quickDraft.source_type, original_input: quickDraft.text });
        window.localStorage.removeItem(quickImportDraftKey);
        setQuickDraft(null);
        toast.info(data?.error || "AI extraction is unavailable here. Using clean fallback extraction for now.");
        return;
      }
      setExtracted(data);
      setMeta({ source_type: quickDraft.source_type, original_input: quickDraft.text });
      window.localStorage.removeItem(quickImportDraftKey);
      setQuickDraft(null);
      if (data.provider === "fallback" || data.notice) {
        toast.info(data.notice || "AI features require an OpenAI API key. Using demo extraction for now.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not analyze quick add draft.");
    } finally {
      setExtractingDraft(false);
    }
  };

  const handleSave = async (data: AssignmentReviewInput) => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setSaving(false);
      return;
    }

    await ensureUserProfile(supabase, user);
    let courseId = data.course_id;

    if (data.course_name && !courseId) {
      const { data: newCourse, error: courseError } = await supabase
        .from("courses")
        .insert({ user_id: user.id, name: data.course_name, color: "#6366f1" })
        .select("id")
        .single();

      if (courseError) {
        if (isMissingSchemaError(courseError)) showDatabaseSetupToast(toast);
        else toast.error("Failed to create course");
        setSaving(false);
        return;
      }
      courseId = newCourse.id;
    }

    const matchedCourse = courses.find((course) => course.name.toLowerCase() === extracted?.course?.toLowerCase());
    if (!courseId && matchedCourse) courseId = matchedCourse.id;

    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .insert({
        user_id: user.id,
        course_id: courseId || null,
        title: cleanAssignmentTitle(data.title),
        description: data.description,
        notes: data.notes || data.original_input || meta?.original_input || "",
        source_type: data.source_type,
        original_input: data.original_input || meta?.original_input || "",
        file_url: data.file_url || meta?.file_url || null,
        due_date: data.due_date || null,
        estimated_minutes: data.estimated_minutes,
        difficulty: data.difficulty,
        priority: data.priority,
        status: "not_started",
        grading_weight: data.grading_weight,
        requirements: data.requirements,
        ai_summary: data.ai_summary,
      })
      .select("id")
      .single();

    if (assignmentError || !assignment) {
      if (assignmentError && isMissingSchemaError(assignmentError)) showDatabaseSetupToast(toast);
      else toast.error(assignmentError?.message || "Failed to save assignment");
      setSaving(false);
      return;
    }

    const steps = data.steps.map((step, index) => ({
      assignment_id: assignment.id,
      step_title: step.step_title,
      step_description: step.step_description,
      estimated_minutes: step.estimated_minutes,
      due_date: step.recommended_due_date || null,
      order_index: index,
      is_done: false,
    }));

    const { error: stepsError } = await supabase.from("assignment_steps").insert(steps);
    if (stepsError) toast.error("Assignment saved but steps failed to create");
    else toast.success("Assignment imported successfully");

    if (meta?.file) {
      try {
        const fileUrl = await uploadAssignmentFile(meta.file);
        await supabase.from("assignments").update({ file_url: fileUrl }).eq("id", assignment.id);
      } catch (uploadErr) {
        toast.warning(uploadErr instanceof Error ? uploadErr.message : "Assignment saved, but file upload was skipped.");
      }
    }

    setSaving(false);
    router.push(`/assignments/${assignment.id}`);
  };

  const reviewDefaults: AssignmentReviewInput | null = extracted
    ? {
        title: cleanAssignmentTitle(extracted.title),
        course_id: courses.find((course) => course.name.toLowerCase() === extracted.course.toLowerCase())?.id || null,
        course_name: extracted.course || "",
        description: extracted.description,
        notes: meta?.original_input || "",
        due_date: extracted.due_date,
        estimated_minutes: extracted.estimated_minutes,
        difficulty: extracted.difficulty,
        priority: extracted.priority,
        requirements: extracted.requirements,
        grading_weight: extracted.grading_weight,
        ai_summary: extracted.ai_summary,
        source_type: meta?.source_type || "paste",
        original_input: meta?.original_input || "",
        file_url: meta?.file_url || null,
        steps: extracted.steps,
      }
    : null;

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Assignment Import Hub
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Import assignments faster</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Connect school tools, sync email, upload files, paste instructions, or do a fast manual entry from one place.
            </p>
          </div>
          <Button onClick={() => document.getElementById("direct-import")?.scrollIntoView({ behavior: "smooth" })}>
            <UploadCloud className="h-4 w-4" />
            Start importing
          </Button>
        </div>

        {quickDraft && !extracted && (
          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Quick Add draft ready</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{quickDraft.text}</p>
              </div>
              <Button onClick={analyzeQuickDraft} disabled={extractingDraft}>
                {extractingDraft ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze draft
              </Button>
            </CardContent>
          </Card>
        )}

        {!extracted ? (
          <>
            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Connect school account
                  </CardTitle>
                  <CardDescription>Sync courses, assignments, due dates, and future updates from school platforms.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {schoolIntegrations.map((integration) => (
                    <IntegrationCard key={integration.name} {...integration} />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Connect email
                  </CardTitle>
                  <CardDescription>Detect teacher announcements, syllabus updates, and assignment emails.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emailIntegrations.map((integration) => (
                    <div key={integration.name} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{integration.name}</p>
                        <Badge variant="outline">Manual approval</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{integration.status}</p>
                      <Button variant="outline" size="sm" className="mt-3" disabled>
                        Connect soon
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card id="direct-import">
              <CardHeader>
                <CardTitle>Direct import</CardTitle>
                <CardDescription>Upload, paste, or type. CramDeck extracts the title, course, due date, requirements, tasks, priority, and study topics.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="import">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="import" className="gap-2">
                      <FileUp className="h-4 w-4" />
                      Import
                    </TabsTrigger>
                    <TabsTrigger value="pipeline" className="gap-2">
                      <Cloud className="h-4 w-4" />
                      Auto sync
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="gap-2">
                      <ClipboardPaste className="h-4 w-4" />
                      Tips
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="import">
                    <AssignmentForm onExtracted={handleExtracted} />
                  </TabsContent>
                  <TabsContent value="pipeline">
                    <div className="grid gap-3 md:grid-cols-3">
                      <PipelineStep icon={BookOpen} title="Sync courses" text="Courses/classes come in first so imported assignments are organized automatically." />
                      <PipelineStep icon={CheckCircle2} title="Review matches" text="CramDeck checks titles, due dates, topics, and duplicates before saving." />
                      <PipelineStep icon={RefreshCw} title="Auto import" text="Future assignments can be imported with manual approval or full auto-import." />
                    </div>
                  </TabsContent>
                  <TabsContent value="tips">
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                      Paste the full assignment instructions, not just the title. If the teacher wrote course, due date, points, rubric, or requirements, include those lines so CramDeck can structure the plan.
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        ) : reviewDefaults ? (
          <AssignmentReviewForm
            defaultValues={reviewDefaults}
            courses={courses}
            onSubmit={handleSave}
            onBack={() => {
              setExtracted(null);
              setMeta(null);
            }}
            loading={saving}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}

function IntegrationCard({ name, status, auth, accent }: { name: string; status: string; auth: string; accent: string }) {
  return (
    <div className="rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={`h-10 w-10 rounded-xl ${accent}`} />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{auth}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Badge variant="outline">{status}</Badge>
        <Button size="sm" variant="outline" disabled>
          Connect
        </Button>
      </div>
    </div>
  );
}

function PipelineStep({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
