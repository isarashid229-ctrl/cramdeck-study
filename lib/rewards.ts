export const PROFILE_DEFAULTS = {
  points: 0,
  streak_count: 0,
  equipped_title: "Rookie Scholar",
  unlocked_titles: ["Rookie Scholar"],
  unlocked_cosmetics: [
    "hair-classic",
    "face-focused",
    "outfit-hoodie",
    "accessory-none",
    "background-desk",
    "effect-none",
    "nameplate-classic",
    "badge-rookie",
    "pet-none",
  ],
  avatar_config: {
    hair: "hair-classic",
    face: "face-focused",
    outfit: "outfit-hoodie",
    accessory: "accessory-none",
    background: "background-desk",
    effect: "effect-none",
    nameplate: "nameplate-classic",
    badge: "badge-rookie",
    pet: "pet-none",
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
  { id: "hair-classic", category: "hair", label: "Classic", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-slate-700" },
  { id: "hair-waves", category: "hair", label: "Waves", cost: 120, rarity: "Uncommon", unlock: "120 points", color: "bg-amber-700" },
  { id: "hair-neon", category: "hair", label: "Neon", cost: 240, rarity: "Rare", unlock: "240 points", color: "bg-cyan-500" },
  { id: "hair-crown", category: "hair", label: "Focus Crown", cost: 900, rarity: "Legendary", unlock: "7-day streak or 900 points", color: "bg-yellow-400" },
  { id: "face-focused", category: "face", label: "Focused", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-orange-200" },
  { id: "face-bright", category: "face", label: "Bright", cost: 90, rarity: "Uncommon", unlock: "90 points", color: "bg-amber-200" },
  { id: "face-calm", category: "face", label: "Calm", cost: 180, rarity: "Rare", unlock: "180 points", color: "bg-rose-200" },
  { id: "outfit-hoodie", category: "outfit", label: "Hoodie", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-indigo-500" },
  { id: "outfit-varsity", category: "outfit", label: "Varsity", cost: 180, rarity: "Uncommon", unlock: "180 points", color: "bg-emerald-500" },
  { id: "outfit-armor", category: "outfit", label: "Quiz Armor", cost: 360, rarity: "Epic", unlock: "Win a quiz duel or 360 points", color: "bg-rose-500" },
  { id: "accessory-none", category: "accessory", label: "None", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-muted" },
  { id: "accessory-glasses", category: "accessory", label: "Focus Glasses", cost: 150, rarity: "Uncommon", unlock: "150 points", color: "bg-yellow-400" },
  { id: "accessory-headset", category: "accessory", label: "Duel Headset", cost: 300, rarity: "Rare", unlock: "300 points", color: "bg-violet-500" },
  { id: "background-desk", category: "background", label: "Study Desk", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-sky-100 dark:bg-sky-950" },
  { id: "background-library", category: "background", label: "Library", cost: 220, rarity: "Uncommon", unlock: "220 points", color: "bg-orange-100 dark:bg-orange-950" },
  { id: "background-arena", category: "background", label: "Duel Arena", cost: 420, rarity: "Epic", unlock: "Win three games or 420 points", color: "bg-fuchsia-100 dark:bg-fuchsia-950" },
  { id: "effect-none", category: "effect", label: "None", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-muted" },
  { id: "effect-spark", category: "effect", label: "Spark", cost: 260, rarity: "Rare", unlock: "260 points", color: "bg-yellow-300" },
  { id: "effect-focus", category: "effect", label: "Focus Aura", cost: 500, rarity: "Epic", unlock: "500 points", color: "bg-primary" },
  { id: "nameplate-classic", category: "nameplate", label: "Classic Plate", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-slate-200 dark:bg-slate-800" },
  { id: "nameplate-scholar", category: "nameplate", label: "Scholar Plate", cost: 280, rarity: "Rare", unlock: "280 points", color: "bg-blue-200 dark:bg-blue-950" },
  { id: "nameplate-legend", category: "nameplate", label: "Legend Plate", cost: 700, rarity: "Legendary", unlock: "Focus Legend or 700 points", color: "bg-yellow-200 dark:bg-yellow-950" },
  { id: "badge-rookie", category: "badge", label: "Rookie Badge", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-slate-300 dark:bg-slate-700" },
  { id: "badge-streak", category: "badge", label: "Streak Badge", cost: 320, rarity: "Rare", unlock: "5-day streak or 320 points", color: "bg-orange-400" },
  { id: "badge-master", category: "badge", label: "Master Badge", cost: 800, rarity: "Legendary", unlock: "CramDeck Master or 800 points", color: "bg-purple-500" },
  { id: "pet-none", category: "pet", label: "No Sidekick", cost: 0, rarity: "Common", unlock: "Free starter item", color: "bg-muted" },
  { id: "pet-orbit", category: "pet", label: "Orbit Sidekick", cost: 520, rarity: "Epic", unlock: "520 points", color: "bg-cyan-300" },
  { id: "pet-star", category: "pet", label: "Star Sidekick", cost: 1000, rarity: "Legendary", unlock: "1000 points", color: "bg-yellow-300" },
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
