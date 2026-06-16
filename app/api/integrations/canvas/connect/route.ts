import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, normalizeCanvasUrl } from "@/lib/integrations/server";

type CanvasCourse = {
  id: number;
  name?: string;
  course_code?: string;
};

export const dynamic = "force-static";

export async function POST(request: NextRequest) {
  if (process.env.GITHUB_PAGES === "true") {
    return NextResponse.json({
      error: "Canvas sync requires a server deployment. Use manual import on GitHub Pages.",
      manualFallback: true,
    });
  }

  const { supabase, user, response } = await getAuthenticatedUser();
  if (response || !user) return response;

  const body = (await request.json().catch(() => null)) as { canvasUrl?: string; accessToken?: string } | null;
  const canvasUrl = body?.canvasUrl;
  const accessToken = body?.accessToken;

  if (!canvasUrl || !accessToken) {
    return NextResponse.json({ error: "Canvas URL and access token are required." }, { status: 400 });
  }

  let baseUrl: string;
  try {
    baseUrl = normalizeCanvasUrl(canvasUrl);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Canvas URL is invalid." }, { status: 400 });
  }

  const testResponse = await fetch(`${baseUrl}/api/v1/courses?enrollment_state=active&per_page=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!testResponse.ok) {
    const message =
      testResponse.status === 401
        ? "Canvas rejected this access token."
        : "Canvas URL could not be reached or did not return courses.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const courses = (await testResponse.json().catch(() => [])) as CanvasCourse[];
  const providerUserId = `${new URL(baseUrl).host}:${user.id}`;
  const { data, error } = await supabase
    .from("connected_accounts")
    .upsert(
      {
        user_id: user.id,
        provider: "canvas",
        provider_user_id: providerUserId,
        provider_base_url: baseUrl,
        display_name: `Canvas (${new URL(baseUrl).host})`,
        access_token: accessToken,
        status: "connected",
        last_error: null,
        metadata: { tested_course_count: courses.length },
      },
      { onConflict: "user_id,provider,provider_user_id" }
    )
    .select("id, display_name, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "Canvas connection tested, but Supabase could not save it." }, { status: 500 });
  }

  return NextResponse.json({
    account: data,
    message: courses.length ? "Canvas connected. You can sync assignments now." : "Canvas connected, but no active courses were returned yet.",
  });
}
