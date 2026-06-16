import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type IntegrationProvider = "google_classroom" | "canvas";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, response: NextResponse.json({ error: "Please log in before connecting accounts." }, { status: 401 }) };
  }

  return { supabase, user, response: null };
}

export function integrationSetupError(message: string, missing: string[]) {
  return NextResponse.json(
    {
      error: message,
      missing,
      manualFallback: "Use the manual import box on /import while this connector is being configured.",
    },
    { status: 400 }
  );
}

export function normalizeCanvasUrl(input: string) {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(trimmed)) {
    throw new Error("Canvas URL must start with https://");
  }
  return trimmed;
}

export async function createSyncRun(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    user_id: string;
    connected_account_id?: string | null;
    provider: string;
    status: "started" | "completed" | "failed" | "needs_setup";
    courses_found?: number;
    assignments_found?: number;
    assignments_imported?: number;
    duplicates_found?: number;
    message?: string | null;
    error?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  return supabase
    .from("sync_runs")
    .insert({
      user_id: input.user_id,
      connected_account_id: input.connected_account_id || null,
      provider: input.provider,
      status: input.status,
      courses_found: input.courses_found || 0,
      assignments_found: input.assignments_found || 0,
      assignments_imported: input.assignments_imported || 0,
      duplicates_found: input.duplicates_found || 0,
      message: input.message || null,
      error: input.error || null,
      metadata: input.metadata || {},
      finished_at: input.status === "started" ? null : new Date().toISOString(),
    })
    .select("id")
    .single();
}
