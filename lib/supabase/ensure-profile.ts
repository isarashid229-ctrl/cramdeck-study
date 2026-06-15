import type { User } from "@supabase/supabase-js";

type SupabaseClient = ReturnType<typeof import("@/lib/supabase/client").createClient>;

export function isSupabaseSetupError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

export async function ensureUserProfile(supabase: SupabaseClient, user: Pick<User, "id" | "email" | "user_metadata">) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      points: 0,
      streak_count: 0,
      equipped_title: "Rookie Scholar",
      unlocked_titles: ["Rookie Scholar"],
      unlocked_cosmetics: ["hair-classic", "outfit-hoodie", "accessory-none", "background-desk", "effect-none"],
      avatar_config: {
        hair: "hair-classic",
        outfit: "outfit-hoodie",
        accessory: "accessory-none",
        background: "background-desk",
        effect: "effect-none",
        color: "indigo",
      },
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error && !isSupabaseSetupError(error)) throw error;
  return !error;
}

export function showDatabaseSetupToast(toast: { warning: (message: string, options?: { id?: string }) => void }) {
  toast.warning("Database setup required. Run supabase/schema.sql, then supabase/policies.sql, in Supabase SQL Editor.", {
    id: "database-setup-required",
  });
}
