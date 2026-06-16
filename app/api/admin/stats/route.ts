import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-static";

type CountResult = {
  key: string;
  label: string;
  value: number | null;
  error?: string;
};

const countTables = [
  ["profiles", "Profiles"],
  ["courses", "Courses"],
  ["assignments", "Assignments"],
  ["quiz_attempts", "Quiz attempts"],
  ["game_sessions", "Game sessions"],
  ["reward_events", "Reward events"],
] as const;

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function countTable(client: SupabaseClient, table: string): Promise<number | null> {
  const { count, error } = await client.from(table).select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function GET() {
  if (process.env.GITHUB_PAGES === "true") {
    return NextResponse.json(
      { error: "Admin stats require a server deployment.", accessDenied: true },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = parseAdminEmails();
  const currentEmail = user?.email?.toLowerCase();

  if (!user || !currentEmail || !adminEmails.includes(currentEmail)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceRoleConfigured = Boolean(supabaseUrl && serviceRoleKey);
  const adminClient = serviceRoleConfigured
    ? createSupabaseAdminClient(supabaseUrl!, serviceRoleKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : (supabase as unknown as SupabaseClient);

  const counts: CountResult[] = [];
  for (const [key, label] of countTables) {
    try {
      counts.push({ key, label, value: await countTable(adminClient, key) });
    } catch (error) {
      counts.push({
        key,
        label,
        value: null,
        error: error instanceof Error ? error.message : "Unable to count table",
      });
    }
  }

  let authUsers: number | null = null;
  if (serviceRoleConfigured) {
    try {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      authUsers = data.users.length;
    } catch {
      authUsers = null;
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: assignmentsToday }, { data: newestUsers }, { data: recentProfiles }, { data: activeAssignmentUsers }, { data: activeQuizUsers }] =
    await Promise.all([
      adminClient
        .from("assignments")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString()),
      adminClient
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      adminClient
        .from("profiles")
        .select("id, full_name, email, created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(8),
      adminClient.from("assignments").select("user_id").gte("updated_at", sevenDaysAgo).limit(1000),
      adminClient.from("quiz_attempts").select("user_id").gte("created_at", sevenDaysAgo).limit(1000),
    ]);

  const activeUserIds = new Set<string>();
  activeAssignmentUsers?.forEach((row) => row.user_id && activeUserIds.add(row.user_id));
  activeQuizUsers?.forEach((row) => row.user_id && activeUserIds.add(row.user_id));

  return NextResponse.json({
    serviceRoleConfigured,
    authUsers,
    counts,
    assignmentsToday: assignmentsToday ?? 0,
    activeUsers: activeUserIds.size,
    newestUsers: newestUsers ?? [],
    recentSignups: recentProfiles ?? [],
  });
}
