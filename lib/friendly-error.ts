export function friendlyErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : error instanceof Error
        ? error.message
        : "";
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const lower = message.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed")
  ) {
    return "EagleCram could not reach Supabase. Check the deployed Supabase URL/anon key and Supabase Auth allowed URLs.";
  }
  if (lower.includes("invalid api key") || lower.includes("apikey") || lower.includes("jwt")) {
    return "The deployed Supabase anon key is invalid or missing. Update the deployment environment variables.";
  }
  if (lower.includes("redirect") && lower.includes("not allowed")) {
    return "Supabase blocked the login redirect URL. Add this deployed app URL in Supabase Auth URL Configuration.";
  }
  if (code === "PGRST205" || lower.includes("schema cache") || lower.includes("could not find the table")) {
    return "Database setup is incomplete. Run the Supabase setup SQL, then restart the app.";
  }
  if (lower.includes("row-level security") || lower.includes("violates row-level security") || lower.includes("rls")) {
    return "Permission setup needs attention. Your account is signed in, but Supabase policies are blocking this action.";
  }
  if (lower.includes("bucket not found")) {
    return "Storage setup is incomplete. Create the assignments bucket or run the storage policies SQL.";
  }
  if (lower.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Supabase is temporarily rate limiting signups. Wait a minute, then try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (lower.includes("already registered") || lower.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message && !lower.includes("sql") && !lower.includes("postgres") && !lower.includes("pgrst")) {
    return message;
  }
  return fallback;
}
