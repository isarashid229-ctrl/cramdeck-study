import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser, createSyncRun } from "@/lib/integrations/server";

type SyncProvider = "google_classroom" | "canvas";

type ConnectedAccount = {
  id: string;
  user_id: string;
  provider: SyncProvider;
  provider_base_url: string | null;
  access_token: string | null;
};

type NormalizedCourse = {
  externalId: string;
  name: string;
  teacher?: string | null;
  subject?: string | null;
  sourceUrl?: string | null;
  raw: Record<string, unknown>;
};

type NormalizedAssignment = {
  externalId: string;
  externalCourseId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  sourceUrl?: string | null;
  raw: Record<string, unknown>;
};

type GoogleCourse = {
  id: string;
  name?: string;
  section?: string;
  alternateLink?: string;
};

type GoogleCourseWork = {
  id: string;
  courseId: string;
  title?: string;
  description?: string;
  alternateLink?: string;
  dueDate?: { year?: number; month?: number; day?: number };
  dueTime?: { hours?: number; minutes?: number };
};

type CanvasCourse = {
  id: number;
  name?: string;
  course_code?: string;
};

type CanvasAssignment = {
  id: number;
  name?: string;
  description?: string;
  due_at?: string | null;
  html_url?: string;
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ provider: "google_classroom" }, { provider: "canvas" }];
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  if (process.env.GITHUB_PAGES === "true") {
    return NextResponse.json({
      error: "Live sync requires a server deployment. Use manual import on GitHub Pages.",
      manualFallback: true,
    });
  }

  const { provider } = await params;
  if (provider !== "google_classroom" && provider !== "canvas") {
    return NextResponse.json({ error: "This provider is not supported yet. Use manual import for now." }, { status: 400 });
  }

  const { supabase, user, response } = await getAuthenticatedUser();
  if (response || !user) return response;

  const { data: accounts, error: accountsError } = await supabase
    .from("connected_accounts")
    .select("id,user_id,provider,provider_base_url,access_token")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("status", "connected");

  if (accountsError) {
    return NextResponse.json({ error: "Database setup is missing integration tables. Run supabase/full-setup.sql." }, { status: 400 });
  }

  if (!accounts?.length) {
    await createSyncRun(supabase, {
      user_id: user.id,
      provider,
      status: "needs_setup",
      message: "No connected account found. Connect this provider or use manual import.",
    });
    return NextResponse.json(
      { error: "No connected account found. Connect this provider or use manual import.", manualFallback: true },
      { status: 400 }
    );
  }

  let totalCourses = 0;
  let totalAssignments = 0;
  let duplicates = 0;
  const accountSummaries: { accountId: string; courses: number; assignments: number }[] = [];

  for (const account of accounts as ConnectedAccount[]) {
    const syncRun = await createSyncRun(supabase, {
      user_id: user.id,
      connected_account_id: account.id,
      provider,
      status: "started",
      message: "Sync started.",
    });

    try {
      const imported = provider === "google_classroom" ? await fetchGoogle(account) : await fetchCanvas(account);
      totalCourses += imported.courses.length;
      totalAssignments += imported.assignments.length;
      accountSummaries.push({ accountId: account.id, courses: imported.courses.length, assignments: imported.assignments.length });

      for (const course of imported.courses) {
        let { data: appCourse } = await supabase
          .from("courses")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", course.name)
          .maybeSingle();

        if (!appCourse) {
          const createdCourse = await supabase
            .from("courses")
            .insert({
              user_id: user.id,
              name: course.name,
              teacher: course.teacher || null,
              subject: course.subject || null,
              color: provider === "canvas" ? "#ef4444" : "#10b981",
              description: `Imported from ${providerLabel(provider)}`,
            })
            .select("id")
            .single();
          appCourse = createdCourse.data;
        }

        await supabase.from("external_courses").upsert(
          {
            user_id: user.id,
            connected_account_id: account.id,
            provider,
            external_id: course.externalId,
            course_id: appCourse?.id || null,
            name: course.name,
            teacher: course.teacher || null,
            subject: course.subject || null,
            source_url: course.sourceUrl || null,
            raw_payload: course.raw,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider,external_id" }
        );
      }

      for (const assignment of imported.assignments) {
        const { data: externalCourse } = await supabase
          .from("external_courses")
          .select("id, course_id, name")
          .eq("user_id", user.id)
          .eq("provider", provider)
          .eq("external_id", assignment.externalCourseId)
          .maybeSingle();

        const duplicate = await findDuplicateAssignment(supabase, user.id, externalCourse?.course_id || null, assignment.title, assignment.dueDate || null);
        if (duplicate) duplicates += 1;

        const { data: externalAssignment } = await supabase
          .from("external_assignments")
          .upsert(
            {
              user_id: user.id,
              connected_account_id: account.id,
              external_course_id: externalCourse?.id || null,
              assignment_id: duplicate?.id || null,
              provider,
              external_id: assignment.externalId,
              title: assignment.title,
              due_date: assignment.dueDate || null,
              description: assignment.description || null,
              source_url: assignment.sourceUrl || null,
              status: duplicate ? "duplicate" : "candidate",
              duplicate_of_assignment_id: duplicate?.id || null,
              raw_payload: assignment.raw,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "user_id,provider,external_id" }
          )
          .select("id")
          .single();

        if (!duplicate) {
          await supabase.from("import_candidates").insert({
            user_id: user.id,
            provider,
            external_assignment_id: externalAssignment?.id || null,
            title: assignment.title,
            course_name: externalCourse?.name || "",
            due_date: assignment.dueDate || null,
            description: assignment.description || "",
            priority: "medium",
            status: "review",
            raw_payload: assignment.raw,
          });
        }
      }

      await supabase
        .from("connected_accounts")
        .update({ last_synced_at: new Date().toISOString(), last_error: null })
        .eq("id", account.id);

      if (syncRun.data?.id) {
        await supabase
          .from("sync_runs")
          .update({
            status: "completed",
            finished_at: new Date().toISOString(),
            courses_found: imported.courses.length,
            assignments_found: imported.assignments.length,
            duplicates_found: duplicates,
            message: `Sync completed: ${imported.assignments.length} assignments found.`,
          })
          .eq("id", syncRun.data.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";
      await supabase.from("connected_accounts").update({ status: "sync_failed", last_error: message }).eq("id", account.id);
      if (syncRun.data?.id) {
        await supabase
          .from("sync_runs")
          .update({ status: "failed", finished_at: new Date().toISOString(), error: message, message })
          .eq("id", syncRun.data.id);
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    message: `Sync completed: ${totalAssignments} assignments found.`,
    courses_found: totalCourses,
    assignments_found: totalAssignments,
    duplicates_found: duplicates,
    accounts: accountSummaries,
  });
}

async function fetchGoogle(account: ConnectedAccount) {
  if (!account.access_token) throw new Error("Google account is missing an access token. Reconnect Google Classroom.");

  const coursesResponse = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE", {
    headers: { Authorization: `Bearer ${account.access_token}` },
  });
  if (!coursesResponse.ok) throw new Error("Google Classroom sync failed. Reconnect Google or check Classroom permissions.");

  const coursesPayload = (await coursesResponse.json()) as { courses?: GoogleCourse[] };
  const courses: NormalizedCourse[] = (coursesPayload.courses || []).map((course) => ({
    externalId: course.id,
    name: course.name || "Untitled Classroom course",
    teacher: null,
    subject: course.section || null,
    sourceUrl: course.alternateLink || null,
    raw: course as Record<string, unknown>,
  }));

  const assignments: NormalizedAssignment[] = [];
  for (const course of courses) {
    const courseWorkResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${course.externalId}/courseWork`, {
      headers: { Authorization: `Bearer ${account.access_token}` },
    });
    if (!courseWorkResponse.ok) continue;
    const courseWorkPayload = (await courseWorkResponse.json()) as { courseWork?: GoogleCourseWork[] };
    for (const work of courseWorkPayload.courseWork || []) {
      assignments.push({
        externalId: `${course.externalId}:${work.id}`,
        externalCourseId: course.externalId,
        title: work.title || "Untitled Classroom assignment",
        description: work.description || "",
        dueDate: googleDueDate(work),
        sourceUrl: work.alternateLink || null,
        raw: work as Record<string, unknown>,
      });
    }
  }

  return { courses, assignments };
}

async function fetchCanvas(account: ConnectedAccount) {
  if (!account.provider_base_url || !account.access_token) throw new Error("Canvas account is missing its URL or token. Reconnect Canvas.");

  const coursesResponse = await fetch(`${account.provider_base_url}/api/v1/courses?enrollment_state=active&per_page=50`, {
    headers: { Authorization: `Bearer ${account.access_token}` },
  });
  if (!coursesResponse.ok) throw new Error("Canvas sync failed. Check your Canvas URL and access token.");

  const canvasCourses = (await coursesResponse.json()) as CanvasCourse[];
  const courses: NormalizedCourse[] = canvasCourses.map((course) => ({
    externalId: String(course.id),
    name: course.name || course.course_code || "Untitled Canvas course",
    subject: course.course_code || null,
    raw: course as Record<string, unknown>,
  }));

  const assignments: NormalizedAssignment[] = [];
  for (const course of courses) {
    const assignmentResponse = await fetch(`${account.provider_base_url}/api/v1/courses/${course.externalId}/assignments?bucket=upcoming&per_page=50`, {
      headers: { Authorization: `Bearer ${account.access_token}` },
    });
    if (!assignmentResponse.ok) continue;
    const canvasAssignments = (await assignmentResponse.json()) as CanvasAssignment[];
    for (const assignment of canvasAssignments) {
      assignments.push({
        externalId: `${course.externalId}:${assignment.id}`,
        externalCourseId: course.externalId,
        title: assignment.name || "Untitled Canvas assignment",
        description: stripHtml(assignment.description || ""),
        dueDate: assignment.due_at || null,
        sourceUrl: assignment.html_url || null,
        raw: assignment as Record<string, unknown>,
      });
    }
  }

  return { courses, assignments };
}

async function findDuplicateAssignment(
  supabase: SupabaseClient,
  userId: string,
  courseId: string | null,
  title: string,
  dueDate: string | null
) {
  let query = supabase.from("assignments").select("id,title,due_date,course_id").eq("user_id", userId).ilike("title", title);
  if (courseId) query = query.eq("course_id", courseId);
  if (dueDate) query = query.eq("due_date", dueDate);
  const { data } = await query.limit(1).maybeSingle();
  return data;
}

function googleDueDate(work: GoogleCourseWork) {
  if (!work.dueDate?.year || !work.dueDate.month || !work.dueDate.day) return null;
  const date = new Date(
    work.dueDate.year,
    work.dueDate.month - 1,
    work.dueDate.day,
    work.dueTime?.hours || 23,
    work.dueTime?.minutes || 59
  );
  return date.toISOString();
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function providerLabel(provider: SyncProvider) {
  return provider === "canvas" ? "Canvas" : "Google Classroom";
}
