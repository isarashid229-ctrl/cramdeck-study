import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  name?: string;
};

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  if (process.env.GITHUB_PAGES === "true") {
    return NextResponse.json({
      error: "Google OAuth callback requires a server deployment. Use manual import on GitHub Pages.",
      manualFallback: true,
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("cramdeck_google_oauth_state")?.value;
  const savedUserId = request.cookies.get("cramdeck_google_oauth_user")?.value;
  const appOrigin = `${url.protocol}//${url.host}`;

  if (!code || !state || state !== savedState || !savedUserId) {
    return NextResponse.redirect(`${appOrigin}/import?integration=google_classroom&status=failed&reason=oauth_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${appOrigin}/import?integration=google_classroom&status=needs_setup`);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokens.access_token) {
    return NextResponse.redirect(
      `${appOrigin}/import?integration=google_classroom&status=failed&reason=${encodeURIComponent(tokens.error_description || tokens.error || "token_exchange")}`
    );
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = userInfoResponse.ok ? ((await userInfoResponse.json()) as GoogleUserInfo) : {};
  const supabase = await createClient();

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { error } = await supabase.from("connected_accounts").upsert(
    {
      user_id: savedUserId,
      provider: "google_classroom",
      provider_user_id: userInfo.sub || userInfo.email || "google-user",
      display_name: userInfo.name || userInfo.email || "Google Classroom",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: expiresAt,
      scopes: tokens.scope?.split(" ") || [],
      status: "connected",
      last_error: null,
      metadata: { email: userInfo.email || null },
    },
    { onConflict: "user_id,provider,provider_user_id" }
  );

  const response = NextResponse.redirect(
    `${appOrigin}/import?integration=google_classroom&status=${error ? "failed" : "connected"}`
  );
  response.cookies.delete("cramdeck_google_oauth_state");
  response.cookies.delete("cramdeck_google_oauth_user");
  return response;
}
