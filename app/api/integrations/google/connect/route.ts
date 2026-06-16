import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, integrationSetupError } from "@/lib/integrations/server";

const scopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
];

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  if (process.env.GITHUB_PAGES === "true") {
    return NextResponse.json({
      error: "Google Classroom sync requires a server deployment. Use manual import on GitHub Pages.",
      manualFallback: true,
    });
  }

  const { user, response } = await getAuthenticatedUser();
  if (response || !user) return response;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const missing: string[] = [];
  if (!clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  if (!redirectUri) missing.push("GOOGLE_REDIRECT_URI");

  if (missing.length) {
    return integrationSetupError("Google Classroom sync requires Google OAuth credentials.", missing);
  }

  if (request.headers.get("x-cramdeck-action") === "check") {
    return NextResponse.json({ ok: true });
  }

  const state = crypto.randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("redirect_uri", redirectUri!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  const redirect = NextResponse.redirect(authUrl);
  redirect.cookies.set("cramdeck_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  });
  redirect.cookies.set("cramdeck_google_oauth_user", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  });

  return redirect;
}
