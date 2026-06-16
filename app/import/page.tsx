"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardPaste,
  Cloud,
  FileUp,
  GraduationCap,
  Mail,
  RefreshCw,
  Settings2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { AssignmentReviewForm } from "@/components/assignments/assignment-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

type Draft = { source_type: "paste" | "manual"; text: string; created_at?: string };
type ProviderId =
  | "google_classroom"
  | "canvas"
  | "schoology"
  | "blackboard"
  | "moodle"
  | "teams_education"
  | "powerschool"
  | "skyward"
  | "gmail"
  | "outlook";

type SetupInfo = {
  provider: ProviderId;
  title: string;
  description: string;
  requirements: string[];
  fallback: string;
};

type ConnectedAccount = {
  id: string;
  provider: string;
  display_name: string | null;
  status: string;
  last_synced_at: string | null;
  last_error: string | null;
  sync_settings: AutoSyncSettings | null;
};

type SyncRun = {
  id: string;
  provider: string;
  status: string;
  message: string | null;
  error: string | null;
  assignments_found: number;
  duplicates_found: number;
  created_at: string;
};

type ImportCandidate = {
  id: string;
  provider: string;
  title: string;
  course_name: string | null;
  due_date: string | null;
  description: string | null;
  status: string;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
};

type AutoSyncSettings = {
  enabled: boolean;
  manual_approval: boolean;
  frequency: "manual" | "hourly" | "daily" | "weekly";
  future_only: boolean;
  avoid_duplicates: boolean;
  notify_new: boolean;
};

const defaultAutoSync: AutoSyncSettings = {
  enabled: false,
  manual_approval: true,
  frequency: "manual",
  future_only: true,
  avoid_duplicates: true,
  notify_new: true,
};

const schoolIntegrations: {
  id: ProviderId;
  name: string;
  status: string;
  auth: string;
  accent: string;
  mode: "oauth" | "token" | "manual";
  manualHint: string;
  setup: SetupInfo;
}[] = [
  {
    id: "google_classroom",
    name: "Google Classroom",
    status: "OAuth ready",
    auth: "Google OAuth",
    accent: "bg-emerald-500",
    mode: "oauth",
    manualHint: "Paste a Google Classroom assignment post or coursework instructions.",
    setup: {
      provider: "google_classroom",
      title: "Google Classroom requires OAuth setup",
      description: "Google Classroom can connect directly when this app is running on a server deployment with Google OAuth credentials.",
      requirements: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "Classroom read scopes enabled in Google Cloud"],
      fallback: "Paste a Classroom post, upload a screenshot, or manually add the assignment here.",
    },
  },
  {
    id: "canvas",
    name: "Canvas",
    status: "Token setup",
    auth: "Canvas URL + access token",
    accent: "bg-red-500",
    mode: "token",
    manualHint: "Paste a Canvas assignment page, module item, or syllabus section.",
    setup: {
      provider: "canvas",
      title: "Canvas uses your school URL and access token",
      description: "Canvas can sync courses and assignments when you provide a valid Canvas URL and personal access token.",
      requirements: ["Canvas school URL, such as https://school.instructure.com", "Canvas access token with course and assignment read access", "Server deployment for live sync"],
      fallback: "Paste a Canvas assignment page, upload a screenshot/PDF, or manually add the assignment.",
    },
  },
  {
    id: "schoology",
    name: "Schoology",
    status: "Manual fallback",
    auth: "API setup required",
    accent: "bg-sky-500",
    mode: "manual",
    manualHint: "Paste the Schoology assignment details here.",
    setup: {
      provider: "schoology",
      title: "Schoology direct sync needs school API setup",
      description: "Schoology access depends on school API permissions, so this build uses manual import until credentials are configured.",
      requirements: ["Schoology API access from the school", "Server-side token storage", "Provider sync route"],
      fallback: "Paste the Schoology assignment page or upload a screenshot/PDF.",
    },
  },
  {
    id: "blackboard",
    name: "Blackboard",
    status: "Manual fallback",
    auth: "REST + school URL required",
    accent: "bg-slate-700",
    mode: "manual",
    manualHint: "Paste the Blackboard assignment page or announcement here.",
    setup: {
      provider: "blackboard",
      title: "Blackboard sync requires institution API access",
      description: "Blackboard integrations vary by school and need a school URL plus API credentials before direct sync can be enabled.",
      requirements: ["Institution Blackboard URL", "REST API application credentials", "Server-side sync route"],
      fallback: "Paste the Blackboard assignment page, announcement, or file export.",
    },
  },
  {
    id: "moodle",
    name: "Moodle",
    status: "Manual fallback",
    auth: "Moodle web services required",
    accent: "bg-orange-500",
    mode: "manual",
    manualHint: "Paste the Moodle activity instructions here.",
    setup: {
      provider: "moodle",
      title: "Moodle sync requires web services access",
      description: "Moodle direct sync depends on whether your school enables Moodle web services for your account.",
      requirements: ["Moodle site URL", "Web services token", "Enabled course/activity API permissions"],
      fallback: "Paste the Moodle activity page or upload the assignment PDF/export.",
    },
  },
  {
    id: "teams_education",
    name: "Teams Education",
    status: "Manual fallback",
    auth: "Microsoft Graph required",
    accent: "bg-indigo-500",
    mode: "manual",
    manualHint: "Paste the Teams assignment message or classwork details here.",
    setup: {
      provider: "teams_education",
      title: "Teams Education sync requires Microsoft Graph",
      description: "Teams assignments need Microsoft Graph app credentials and school tenant permissions before direct sync can work.",
      requirements: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "Education assignment read permissions"],
      fallback: "Paste a Teams assignment message, upload a screenshot, or manually add the work.",
    },
  },
  {
    id: "powerschool",
    name: "PowerSchool",
    status: "Manual fallback",
    auth: "District dependent",
    accent: "bg-violet-500",
    mode: "manual",
    manualHint: "Paste the PowerSchool assignment row, grade detail, or deadline here.",
    setup: {
      provider: "powerschool",
      title: "PowerSchool is district dependent",
      description: "PowerSchool direct access depends on district portal settings and available APIs, so manual import is the reliable path here.",
      requirements: ["District PowerSchool API access", "School-approved credentials", "Server-side sync adapter"],
      fallback: "Paste a PowerSchool assignment row, upload a screenshot/PDF, or manually add the assignment.",
    },
  },
  {
    id: "skyward",
    name: "Skyward",
    status: "Manual fallback",
    auth: "District dependent SIS",
    accent: "bg-cyan-500",
    mode: "manual",
    manualHint: "Paste the Skyward assignment page, gradebook row, missing work notice, or deadline here.",
    setup: {
      provider: "skyward",
      title: "Skyward is district dependent",
      description: "Skyward portals vary by district and usually do not provide a student-facing public API, so this build supports a strong manual import workflow.",
      requirements: ["District Skyward portal access", "Approved API/export access if your district offers it", "Server-side sync adapter for direct integration"],
      fallback: "Paste Skyward assignment text, upload a screenshot, upload a PDF/export, or manually add the course and assignment.",
    },
  },
];

const emailIntegrations = [
  {
    id: "gmail" as ProviderId,
    name: "Gmail",
    status: "Manual email import",
    auth: "Paste email, screenshot, PDF, or export",
  },
  {
    id: "outlook" as ProviderId,
    name: "Outlook",
    status: "Manual email import",
    auth: "Paste email, screenshot, PDF, or export",
  },
];

export default function ImportPage() {
  const router = useRouter();
  const supabase = createClient();
  const { data: courses = [] } = useCourses();
  const [quickDraft, setQuickDraft] = useState<Draft | null>(null);
  const [manualHint, setManualHint] = useState("Paste the full assignment instructions, email, screenshot text, syllabus line, or LMS page text.");
  const [extractingDraft, setExtractingDraft] = useState(false);
  const [extracted, setExtracted] = useState<AIExtractionResult | null>(null);
  const [meta, setMeta] = useState<{ source_type: string; original_input: string; file_url?: string; file?: File } | null>(null);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [integrationTablesReady, setIntegrationTablesReady] = useState(true);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState<ProviderId | null>(null);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [canvasToken, setCanvasToken] = useState("");
  const [savingCanvas, setSavingCanvas] = useState(false);
  const [autoSync, setAutoSync] = useState<AutoSyncSettings>(defaultAutoSync);
  const [setupInfo, setSetupInfo] = useState<SetupInfo | null>(null);

  const isStaticPagesBuild = typeof window !== "undefined" && window.location.hostname.includes("github.io");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const integration = params.get("integration");
    const reason = params.get("reason");
    if (!status || !integration) return;

    if (status === "connected") toast.success(`${providerName(integration)} connected. Run Sync now to review imported work.`);
    if (status === "needs_setup") toast.info(`${providerName(integration)} needs OAuth credentials before it can connect.`);
    if (status === "failed") toast.error(`Connection failed: ${reason || "try again or use manual import."}`);
  }, []);

  useEffect(() => {
    const rawSettings = window.localStorage.getItem("cramdeck-auto-sync-settings");
    if (rawSettings) setAutoSync({ ...defaultAutoSync, ...JSON.parse(rawSettings) });

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

  useEffect(() => {
    void loadIntegrationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectedByProvider = useMemo(() => {
    return accounts.reduce<Record<string, ConnectedAccount>>((map, account) => {
      map[account.provider] = account;
      return map;
    }, {});
  }, [accounts]);

  const handleExtracted = (
    result: AIExtractionResult,
    extractionMeta: { source_type: string; original_input: string; file_url?: string; file?: File }
  ) => {
    setExtracted(result);
    setMeta(extractionMeta);
  };

  const loadIntegrationData = async () => {
    setLoadingIntegrations(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadingIntegrations(false);
      return;
    }

    const [accountsResult, runsResult, candidatesResult] = await Promise.all([
      supabase
        .from("connected_accounts")
        .select("id,provider,display_name,status,last_synced_at,last_error,sync_settings")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("sync_runs")
        .select("id,provider,status,message,error,assignments_found,duplicates_found,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("import_candidates")
        .select("id,provider,title,course_name,due_date,description,status,raw_payload,created_at")
        .eq("user_id", user.id)
        .eq("status", "review")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (accountsResult.error || runsResult.error || candidatesResult.error) {
      const error = accountsResult.error || runsResult.error || candidatesResult.error;
      if (error && isMissingSchemaError(error)) {
        setIntegrationTablesReady(false);
      } else if (error) {
        toast.error("Integration history could not load. Manual import still works.");
      }
    } else {
      setIntegrationTablesReady(true);
      setAccounts((accountsResult.data || []) as ConnectedAccount[]);
      setSyncRuns((runsResult.data || []) as SyncRun[]);
      setCandidates((candidatesResult.data || []) as ImportCandidate[]);
    }

    setLoadingIntegrations(false);
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
    } catch {
      const fallback = fallbackAssignmentExtraction(quickDraft.text);
      setExtracted(fallback);
      setMeta({ source_type: quickDraft.source_type, original_input: quickDraft.text });
      window.localStorage.removeItem(quickImportDraftKey);
      setQuickDraft(null);
      toast.info("Server extraction is unavailable here. Using clean fallback extraction for now.");
    } finally {
      setExtractingDraft(false);
    }
  };

  const connectGoogle = async () => {
    const googleSetup = schoolIntegrations.find((integration) => integration.id === "google_classroom")?.setup;
    if (isStaticPagesBuild) {
      setSetupInfo(googleSetup || null);
      toast.info("Google Classroom sync needs a server deployment with OAuth credentials. Manual import works here.");
      return;
    }

    try {
      const response = await fetch("/api/integrations/google/connect", {
        headers: { "x-cramdeck-action": "check" },
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok) {
        window.location.href = "/api/integrations/google/connect";
        return;
      }
      if (data?.missing || data?.manualFallback) setSetupInfo(googleSetup || null);
      toast.error(data?.error || "Google Classroom could not start.");
    } catch {
      setSetupInfo(googleSetup || null);
      toast.error("Google Classroom sync needs a server deployment. Manual import still works.");
    }
  };

  const saveCanvasConnection = async () => {
    if (isStaticPagesBuild) {
      toast.info("Canvas token sync needs a server deployment. Paste Canvas assignments below for now.");
      openManualImport("Canvas", "Paste a Canvas assignment page, module item, or syllabus line.");
      setCanvasOpen(false);
      return;
    }

    setSavingCanvas(true);
    try {
      const response = await fetch("/api/integrations/canvas/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasUrl, accessToken: canvasToken }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error || "Canvas connection failed.");
        return;
      }
      toast.success(data?.message || "Canvas connected.");
      setCanvasOpen(false);
      setCanvasToken("");
      void loadIntegrationData();
    } catch {
      toast.error("Canvas connection needs a server deployment. Manual import still works.");
    } finally {
      setSavingCanvas(false);
    }
  };

  const syncProvider = async (provider: ProviderId) => {
    if (provider !== "google_classroom" && provider !== "canvas") {
      openManualImport(providerName(provider), `${providerName(provider)} sync is not configured yet. Paste or upload the assignment instead.`);
      toast.info(`${providerName(provider)} requires provider API setup. Manual import is ready now.`);
      return;
    }

    if (isStaticPagesBuild) {
      toast.info("Live sync needs a server deployment. Manual import works on this public demo.");
      openManualImport(providerName(provider), `Paste ${providerName(provider)} assignment details here.`);
      return;
    }

    setSyncingProvider(provider);
    try {
      const response = await fetch(`/api/integrations/${provider}/sync`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error || "Sync failed. Manual import still works.");
        return;
      }
      toast.success(data?.message || "Sync completed.");
      void loadIntegrationData();
    } catch {
      toast.error("Sync needs a server deployment. Manual import still works.");
    } finally {
      setSyncingProvider(null);
    }
  };

  const saveAutoSyncSettings = async () => {
    window.localStorage.setItem("cramdeck-auto-sync-settings", JSON.stringify(autoSync));
    const connectedIds = accounts.map((account) => account.id);
    if (connectedIds.length) {
      await supabase.from("connected_accounts").update({ sync_settings: autoSync }).in("id", connectedIds);
    }
    toast.success(
      autoSync.frequency === "manual"
        ? "Auto sync settings saved. Use Sync now until deployment cron is configured."
        : "Auto sync settings saved. Scheduled sync requires deployment cron."
    );
  };

  const reviewCandidate = (candidate: ImportCandidate) => {
    const text = [
      `Source: ${providerName(candidate.provider)}`,
      candidate.course_name ? `Course: ${candidate.course_name}` : "",
      `Assignment: ${candidate.title}`,
      candidate.due_date ? `Due: ${candidate.due_date}` : "",
      candidate.description || "",
    ]
      .filter(Boolean)
      .join("\n");
    const fallback = fallbackAssignmentExtraction(text);
    setExtracted({
      ...fallback,
      title: candidate.title,
      course: candidate.course_name || fallback.course,
      due_date: candidate.due_date || fallback.due_date,
      description: candidate.description || fallback.description,
    });
    setMeta({ source_type: candidate.provider, original_input: text });
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ignoreCandidate = async (candidate: ImportCandidate) => {
    const { error } = await supabase.from("import_candidates").update({ status: "ignored" }).eq("id", candidate.id);
    if (error) toast.error("Could not ignore this import candidate.");
    else {
      toast.success("Import candidate ignored.");
      setCandidates((current) => current.filter((item) => item.id !== candidate.id));
    }
  };

  const openManualImport = (source: string, hint: string) => {
    setManualHint(hint);
    setQuickDraft({
      source_type: "paste",
      text: `${source} import:\n\n`,
      created_at: new Date().toISOString(),
    });
    setTimeout(() => document.getElementById("direct-import")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openUploadImport = (source: string, hint: string) => {
    setManualHint(hint);
    toast.info(`${source}: use the Upload tab to add a screenshot, PDF, or export.`);
    setTimeout(() => document.getElementById("direct-import")?.scrollIntoView({ behavior: "smooth" }), 50);
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

    const duplicate = await findDuplicate(courseId || null, data.title, data.due_date || null);
    if (duplicate) {
      toast.info("This looks like an assignment you already imported. Opening the existing assignment.");
      setSaving(false);
      router.push(`/assignments/${duplicate.id}`);
      return;
    }

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

  const findDuplicate = async (courseId: string | null, title: string, dueDate: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    let query = supabase.from("assignments").select("id,title").eq("user_id", user.id).ilike("title", cleanAssignmentTitle(title));
    if (courseId) query = query.eq("course_id", courseId);
    if (dueDate) query = query.eq("due_date", dueDate);
    const { data } = await query.limit(1).maybeSingle();
    return data;
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
              Connect supported school tools, configure sync, review imported work, or use manual import when a provider needs setup.
            </p>
          </div>
          <Button onClick={() => document.getElementById("direct-import")?.scrollIntoView({ behavior: "smooth" })}>
            <UploadCloud className="h-4 w-4" />
            Start importing
          </Button>
        </div>

        {!integrationTablesReady && (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium">Integration tables need setup</p>
                  <p className="text-sm text-muted-foreground">Manual import works now. Run the updated Supabase SQL to enable connected accounts, sync logs, and import history.</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => router.push("/setup")}>View setup</Button>
            </CardContent>
          </Card>
        )}

        {quickDraft && !extracted && (
          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Quick import draft ready</p>
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
            <Card id="quick-import">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardPaste className="h-5 w-5 text-primary" />
                  Quick import
                </CardTitle>
                <CardDescription>{manualHint}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Paste from Google Classroom", "Paste a copied Classroom assignment post."],
                  ["Paste from Canvas", "Paste a Canvas assignment page or module item."],
                  ["Paste from Skyward", "Paste a Skyward gradebook row, missing work notice, or assignment page."],
                  ["Paste from email", "Paste a teacher email or announcement."],
                  ["Upload screenshot", "Use the upload tab below for screenshot text."],
                  ["Upload PDF or syllabus", "Use the upload tab below for PDFs, syllabi, or files."],
                  ["Manual quick add", "Type the assignment yourself and save it."],
                ].map(([title, hint]) => (
                  <Button key={title} variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => openManualImport(title, hint)}>
                    <FileUp className="h-4 w-4 shrink-0" />
                    {title}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Connect school account
                  </CardTitle>
                  <CardDescription>Google and Canvas can sync on a server deployment. Other platforms show a manual import path until their API setup is added.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {schoolIntegrations.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      account={connectedByProvider[integration.id]}
                      syncing={syncingProvider === integration.id}
                      onConnect={() => {
                        if (integration.id === "google_classroom") void connectGoogle();
                        else if (integration.id === "canvas") setCanvasOpen(true);
                        else openManualImport(integration.name, integration.manualHint);
                      }}
                      onSync={() => void syncProvider(integration.id)}
                      onManual={() => openManualImport(integration.name, integration.manualHint)}
                      onUpload={() => openUploadImport(integration.name, integration.manualHint)}
                      onSetup={() => setSetupInfo(integration.setup)}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Connect email
                  </CardTitle>
                  <CardDescription>Email OAuth is not enabled yet, so these use a working paste/upload workflow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emailIntegrations.map((integration) => (
                    <div key={integration.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{integration.auth}</p>
                        </div>
                        <Badge variant="outline">{integration.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => openManualImport(integration.name, `Paste a ${integration.name} assignment email or upload an email screenshot/PDF.`)}>
                          Paste email
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => document.getElementById("direct-import")?.scrollIntoView({ behavior: "smooth" })}>
                          Upload file
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openManualImport(integration.name, `Manually add assignment details from ${integration.name}.`)}>
                          Manual add
                        </Button>
                      </div>
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
                    <TabsTrigger value="history" className="gap-2">
                      <ClipboardPaste className="h-4 w-4" />
                      History
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="import">
                    <AssignmentForm onExtracted={handleExtracted} />
                  </TabsContent>
                  <TabsContent value="pipeline">
                    <AutoSyncPanel
                      settings={autoSync}
                      onChange={setAutoSync}
                      onSave={saveAutoSyncSettings}
                      onSyncAll={() => {
                        const liveProviders = accounts
                          .map((account) => account.provider as ProviderId)
                          .filter((provider) => provider === "google_classroom" || provider === "canvas");
                        if (!liveProviders.length) {
                          toast.info("Connect Google Classroom or Canvas first. Manual import works now.");
                          return;
                        }
                        liveProviders.forEach((provider) => void syncProvider(provider));
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="history">
                    <ImportHistory
                      loading={loadingIntegrations}
                      syncRuns={syncRuns}
                      candidates={candidates}
                      onReview={reviewCandidate}
                      onIgnore={ignoreCandidate}
                    />
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

      <Dialog open={canvasOpen} onOpenChange={setCanvasOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              Canvas token sync works on server deployments. Add your school Canvas URL and a Canvas access token; CramDeck tests it before saving.
            </div>
            <div className="space-y-2">
              <Label htmlFor="canvas-url">School Canvas URL</Label>
              <Input id="canvas-url" placeholder="https://school.instructure.com" value={canvasUrl} onChange={(event) => setCanvasUrl(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canvas-token">Canvas access token</Label>
              <Input id="canvas-token" type="password" placeholder="Paste token" value={canvasToken} onChange={(event) => setCanvasToken(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={saveCanvasConnection} disabled={savingCanvas || !canvasUrl || !canvasToken}>
                {savingCanvas ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
                Test and save
              </Button>
              <Button variant="outline" onClick={() => openManualImport("Canvas", "Paste a Canvas assignment page or module item.")}>
                Use manual import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(setupInfo)} onOpenChange={(open) => !open && setSetupInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{setupInfo?.title}</DialogTitle>
          </DialogHeader>
          {setupInfo && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{setupInfo.description}</p>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-sm font-medium">Setup needed</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {setupInfo.requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
                <p className="font-medium">Works now</p>
                <p className="mt-1 text-muted-foreground">{setupInfo.fallback}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => {
                    openManualImport(providerName(setupInfo.provider), setupInfo.fallback);
                    setSetupInfo(null);
                  }}
                >
                  Paste assignment page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    openUploadImport(providerName(setupInfo.provider), setupInfo.fallback);
                    setSetupInfo(null);
                  }}
                >
                  Upload screenshot/PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function IntegrationCard({
  integration,
  account,
  syncing,
  onConnect,
  onSync,
  onManual,
  onUpload,
  onSetup,
}: {
  integration: (typeof schoolIntegrations)[number];
  account?: ConnectedAccount;
  syncing: boolean;
  onConnect: () => void;
  onSync: () => void;
  onManual: () => void;
  onUpload: () => void;
  onSetup: () => void;
}) {
  const connected = account?.status === "connected";
  const failed = account?.status === "sync_failed";
  return (
    <div className="rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={`h-10 w-10 rounded-xl ${integration.accent}`} />
        <div className="min-w-0">
          <p className="font-medium">{integration.name}</p>
          <p className="truncate text-xs text-muted-foreground">{account?.display_name || integration.auth}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant={connected ? "default" : failed ? "destructive" : "outline"}>
          {connected ? "Connected" : failed ? "Sync failed" : integration.status}
        </Badge>
        {account?.last_synced_at && <Badge variant="secondary">Last sync {new Date(account.last_synced_at).toLocaleDateString()}</Badge>}
      </div>
      {account?.last_error && <p className="mt-2 text-xs text-destructive">{account.last_error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {connected ? (
          <Button size="sm" onClick={onSync} disabled={syncing}>
            {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync now
          </Button>
        ) : (
          <Button size="sm" variant={integration.mode === "manual" ? "outline" : "default"} onClick={onConnect}>
            {integration.mode === "oauth" ? "Connect" : integration.mode === "token" ? "Configure" : "Import manually"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={integration.mode === "manual" ? onUpload : onManual}>
          {integration.mode === "manual" ? "Upload file" : "Manual import"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onSetup}>
          Setup info
        </Button>
      </div>
    </div>
  );
}

function AutoSyncPanel({
  settings,
  onChange,
  onSave,
  onSyncAll,
}: {
  settings: AutoSyncSettings;
  onChange: (settings: AutoSyncSettings) => void;
  onSave: () => void;
  onSyncAll: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <PipelineStep icon={BookOpen} title="Sync courses" text="Connected accounts import courses first so assignments can land in the right class." />
        <PipelineStep icon={CheckCircle2} title="Review matches" text="CramDeck checks title, due date, course, source provider, and duplicate candidates." />
        <PipelineStep icon={RefreshCw} title="Manual sync now" text="Scheduled sync needs deployment cron. Manual sync works on server deployments." />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow label="Auto sync enabled" description="Turns scheduled sync on once deployment cron is configured." checked={settings.enabled} onChange={(enabled) => onChange({ ...settings, enabled })} />
        <ToggleRow label="Manual approval required" description="New assignments go to review before saving." checked={settings.manual_approval} onChange={(manual_approval) => onChange({ ...settings, manual_approval })} />
        <ToggleRow label="Future assignments only" description="Skip old coursework when syncing." checked={settings.future_only} onChange={(future_only) => onChange({ ...settings, future_only })} />
        <ToggleRow label="Avoid duplicates" description="Check title, course, due date, and external ID before importing." checked={settings.avoid_duplicates} onChange={(avoid_duplicates) => onChange({ ...settings, avoid_duplicates })} />
        <ToggleRow label="Notify on new work" description="Create a notification when new assignments are found." checked={settings.notify_new} onChange={(notify_new) => onChange({ ...settings, notify_new })} />
        <div className="rounded-xl border p-4">
          <Label>Sync frequency</Label>
          <Select value={settings.frequency} onValueChange={(frequency) => onChange({ ...settings, frequency: frequency as AutoSyncSettings["frequency"] })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual only</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onSyncAll}>
          <RefreshCw className="h-4 w-4" />
          Sync connected accounts now
        </Button>
        <Button variant="outline" onClick={onSave}>
          Save sync settings
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ImportHistory({
  loading,
  syncRuns,
  candidates,
  onReview,
  onIgnore,
}: {
  loading: boolean;
  syncRuns: SyncRun[];
  candidates: ImportCandidate[];
  onReview: (candidate: ImportCandidate) => void;
  onIgnore: (candidate: ImportCandidate) => void;
}) {
  if (loading) return <div className="rounded-xl border p-4 text-sm text-muted-foreground">Loading import history...</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Review queue</h3>
        {candidates.length ? (
          candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{candidate.title}</p>
                  <p className="text-sm text-muted-foreground">{candidate.course_name || providerName(candidate.provider)}{candidate.due_date ? ` · Due ${new Date(candidate.due_date).toLocaleDateString()}` : ""}</p>
                </div>
                <Badge variant="outline">{providerName(candidate.provider)}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{candidate.description || "No description was provided by the source."}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => onReview(candidate)}>Review</Button>
                <Button size="sm" variant="ghost" onClick={() => onIgnore(candidate)}>Ignore</Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">No import candidates yet. Connect a provider or paste assignments manually.</div>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Recent sync runs</h3>
        {syncRuns.length ? (
          syncRuns.map((run) => (
            <div key={run.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{providerName(run.provider)}</p>
                <Badge variant={run.status === "completed" ? "default" : run.status === "failed" ? "destructive" : "outline"}>{run.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{run.message || run.error || "Sync recorded."}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {run.assignments_found} found · {run.duplicates_found} duplicates · {new Date(run.created_at).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">No sync runs yet. Manual import works immediately.</div>
        )}
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

function providerName(provider: string) {
  const labels: Record<string, string> = {
    google_classroom: "Google Classroom",
    canvas: "Canvas",
    schoology: "Schoology",
    blackboard: "Blackboard",
    moodle: "Moodle",
    teams_education: "Teams Education",
    powerschool: "PowerSchool",
    skyward: "Skyward",
    gmail: "Gmail",
    outlook: "Outlook",
  };
  return labels[provider] || provider;
}
