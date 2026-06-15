"use client";

import { useMemo, useState } from "react";
import { Check, Coins, Lock, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ShopSkeleton, Skeleton } from "@/components/layout/skeletons";
import { AvatarPreview } from "@/components/avatar/avatar-preview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_ITEMS, getAvatarConfig, PROFILE_DEFAULTS, TITLE_UNLOCKS } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { friendlyErrorMessage } from "@/lib/friendly-error";

const categories = ["hair", "outfit", "accessory", "background", "effect"] as const;

export default function AvatarPage() {
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const avatar = getAvatarConfig(profile);
  const points = Number(profile?.points ?? 0);
  const unlockedCosmetics = useMemo(
    () => new Set([...(profile?.unlocked_cosmetics ?? PROFILE_DEFAULTS.unlocked_cosmetics)]),
    [profile?.unlocked_cosmetics]
  );
  const unlockedTitles = useMemo(
    () => new Set([...(profile?.unlocked_titles ?? PROFILE_DEFAULTS.unlocked_titles)]),
    [profile?.unlocked_titles]
  );

  const updateProfile = async (values: Record<string, unknown>) => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update(values).eq("id", profile?.id);
    setSaving(false);

    if (error) {
      toast.error(friendlyErrorMessage(error, "Could not save avatar changes."));
      return false;
    }

    queryClient.invalidateQueries({ queryKey: ["profile"] });
    return true;
  };

  const unlockOrEquip = async (item: (typeof AVATAR_ITEMS)[number]) => {
    if (!profile) return;
    const isUnlocked = unlockedCosmetics.has(item.id);
    const nextAvatar = { ...avatar, [item.category]: item.id };

    if (!isUnlocked && points < item.cost) {
      toast.error(`You need ${item.cost - points} more points to unlock ${item.label}.`);
      return;
    }

    const nextUnlocked = Array.from(new Set([...unlockedCosmetics, item.id]));
    const ok = await updateProfile({
      points: isUnlocked ? points : points - item.cost,
      unlocked_cosmetics: nextUnlocked,
      avatar_config: nextAvatar,
    });

    if (ok) toast.success(isUnlocked ? `${item.label} equipped` : `${item.label} unlocked and equipped`);
  };

  const equipTitle = async (title: string) => {
    if (!unlockedTitles.has(title)) {
      toast.error("Unlock this title before equipping it.");
      return;
    }
    const ok = await updateProfile({ equipped_title: title });
    if (ok) toast.success(`${title} equipped`);
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <ShopSkeleton />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Avatar studio
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Customize your avatar</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Spend earned points on cosmetics, equip a display title, and bring your study character into games.
            </p>
          </div>
          <Badge className="w-fit gap-1 px-3 py-1.5 text-sm">
            <Coins className="h-4 w-4" />
            {points} points
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <AvatarPreview profile={profile} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equipped title</CardTitle>
                <CardDescription>{profile?.equipped_title || "Rookie Scholar"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {TITLE_UNLOCKS.map((title) => {
                  const unlocked = unlockedTitles.has(title.id) || points >= title.points;
                  return (
                    <button
                      key={title.id}
                      type="button"
                      onClick={() => equipTitle(title.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm transition-colors",
                        unlocked ? "hover:bg-muted" : "opacity-60",
                        profile?.equipped_title === title.id && "border-primary bg-primary/10"
                      )}
                    >
                      <span>
                        <span className="block font-medium">{title.id}</span>
                        <span className="text-xs text-muted-foreground">{title.rule}</span>
                      </span>
                      {unlocked ? <Check className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cosmetics</CardTitle>
              <CardDescription>Free items are ready now. Premium items unlock with points.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hair">
                <TabsList className="flex h-auto flex-wrap justify-start">
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category} className="capitalize">
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {AVATAR_ITEMS.filter((item) => item.category === category).map((item) => {
                        const unlocked = unlockedCosmetics.has(item.id);
                        const equipped = avatar[category] === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={saving}
                            onClick={() => unlockOrEquip(item)}
                            className={cn(
                              "rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                              equipped && "border-primary bg-primary/10"
                            )}
                          >
                            <div className={cn("mb-3 h-12 rounded-xl border", item.color)} />
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{item.label}</span>
                              {equipped ? (
                                <Badge>Equipped</Badge>
                              ) : unlocked ? (
                                <Badge variant="secondary">Owned</Badge>
                              ) : (
                                <Badge variant="outline">{item.cost} pts</Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
