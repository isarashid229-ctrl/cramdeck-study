export const PROFILE_DEFAULTS = {
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
};

export const TITLE_UNLOCKS = [
  { id: "Rookie Scholar", points: 0, rule: "Start your CramDeck journey" },
  { id: "Flashcard Fighter", points: 150, rule: "Win flashcard games" },
  { id: "Quiz Slayer", points: 300, rule: "Complete quizzes" },
  { id: "Calendar Champion", points: 450, rule: "Follow calendar plans" },
  { id: "Homework Hunter", points: 600, rule: "Complete assignments" },
  { id: "Study Beast", points: 850, rule: "Maintain a study streak" },
  { id: "CramDeck Master", points: 1200, rule: "Master the deck" },
  { id: "AI Duelist", points: 1500, rule: "Beat AI opponents" },
  { id: "Deadline Destroyer", points: 2000, rule: "Crush deadlines" },
  { id: "Focus Legend", points: 2500, rule: "Win focus sprints" },
];

export const AVATAR_ITEMS = [
  { id: "hair-classic", category: "hair", label: "Classic", cost: 0, color: "bg-slate-700" },
  { id: "hair-waves", category: "hair", label: "Waves", cost: 120, color: "bg-amber-700" },
  { id: "hair-neon", category: "hair", label: "Neon", cost: 240, color: "bg-cyan-500" },
  { id: "outfit-hoodie", category: "outfit", label: "Hoodie", cost: 0, color: "bg-indigo-500" },
  { id: "outfit-varsity", category: "outfit", label: "Varsity", cost: 180, color: "bg-emerald-500" },
  { id: "outfit-armor", category: "outfit", label: "Quiz Armor", cost: 360, color: "bg-rose-500" },
  { id: "accessory-none", category: "accessory", label: "None", cost: 0, color: "bg-muted" },
  { id: "accessory-glasses", category: "accessory", label: "Focus Glasses", cost: 150, color: "bg-yellow-400" },
  { id: "accessory-headset", category: "accessory", label: "Duel Headset", cost: 300, color: "bg-violet-500" },
  { id: "background-desk", category: "background", label: "Study Desk", cost: 0, color: "bg-sky-100 dark:bg-sky-950" },
  { id: "background-library", category: "background", label: "Library", cost: 220, color: "bg-orange-100 dark:bg-orange-950" },
  { id: "background-arena", category: "background", label: "Duel Arena", cost: 420, color: "bg-fuchsia-100 dark:bg-fuchsia-950" },
  { id: "effect-none", category: "effect", label: "None", cost: 0, color: "bg-muted" },
  { id: "effect-spark", category: "effect", label: "Spark", cost: 260, color: "bg-yellow-300" },
  { id: "effect-focus", category: "effect", label: "Focus Aura", cost: 500, color: "bg-primary" },
] as const;

export type AvatarConfig = typeof PROFILE_DEFAULTS.avatar_config;

export function getAvatarConfig(profile: { avatar_config?: unknown } | null | undefined): AvatarConfig {
  if (!profile || typeof profile.avatar_config !== "object" || profile.avatar_config === null) {
    return PROFILE_DEFAULTS.avatar_config;
  }
  return { ...PROFILE_DEFAULTS.avatar_config, ...(profile.avatar_config as Partial<AvatarConfig>) };
}

export function getUnlockedTitles(points: number, existing?: string[] | null) {
  return Array.from(
    new Set([
      ...(existing?.length ? existing : PROFILE_DEFAULTS.unlocked_titles),
      ...TITLE_UNLOCKS.filter((title) => points >= title.points).map((title) => title.id),
    ])
  );
}

export async function awardPoints(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  userId: string,
  amount: number,
  reason: string,
  sourceType: string,
  sourceId?: string | null,
  context?: { courseId?: string | null; assignmentId?: string | null; activityType?: string | null }
) {
  if (!userId || amount <= 0) return null;

  const { ensureUserProfile } = await import("@/lib/supabase/ensure-profile");
  await ensureUserProfile(supabase, { id: userId, email: undefined, user_metadata: {} });

  const { data: profile } = await supabase
    .from("profiles")
    .select("points, unlocked_titles, streak_count, last_reward_date")
    .eq("id", userId)
    .single();

  const currentPoints = Number(profile?.points ?? 0);
  const nextPoints = currentPoints + amount;
  const unlockedTitles = getUnlockedTitles(nextPoints, profile?.unlocked_titles as string[] | null);
  const today = new Date().toISOString().slice(0, 10);
  const shouldIncreaseStreak = sourceType === "assignment" || sourceType === "study_session" || sourceType === "calendar";
  const nextStreak =
    shouldIncreaseStreak && profile?.last_reward_date !== today
      ? Number(profile?.streak_count ?? 0) + 1
      : Number(profile?.streak_count ?? 0);

  const { error } = await supabase
    .from("profiles")
    .update({
      points: nextPoints,
      unlocked_titles: unlockedTitles,
      streak_count: nextStreak,
      last_reward_date: shouldIncreaseStreak ? today : profile?.last_reward_date,
    })
    .eq("id", userId);

  if (error) throw error;

  await supabase.from("reward_events").insert({
    user_id: userId,
    course_id: context?.courseId ?? null,
    assignment_id: context?.assignmentId ?? null,
    activity_type: context?.activityType ?? sourceType,
    points: amount,
    reason,
    source_type: sourceType,
    source_id: sourceId,
  });

  return { points: nextPoints, unlockedTitles };
}
