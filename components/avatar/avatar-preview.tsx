"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATAR_ITEMS, getAvatarConfig } from "@/lib/rewards";

type AvatarPreviewProps = {
  profile?: { avatar_config?: unknown; equipped_title?: string | null; full_name?: string | null } | null;
  size?: "sm" | "lg";
};

export function AvatarPreview({ profile, size = "lg" }: AvatarPreviewProps) {
  const avatar = getAvatarConfig(profile);
  const item = (id: string) => AVATAR_ITEMS.find((candidate) => candidate.id === id);
  const hair = item(avatar.hair);
  const outfit = item(avatar.outfit);
  const accessory = item(avatar.accessory);
  const background = item(avatar.background);
  const effect = item(avatar.effect);

  return (
    <div className={cn("rounded-2xl border p-4", background?.color || "bg-muted/40", size === "sm" && "p-3")}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full border-4 border-background shadow-lg",
            size === "sm" ? "h-16 w-16" : "h-28 w-28"
          )}
        >
          {effect?.id !== "effect-none" && (
            <span className="absolute inset-[-8px] animate-pulse rounded-full bg-primary/20" />
          )}
          <div className={cn("absolute top-2 rounded-t-full", hair?.color, size === "sm" ? "h-5 w-10" : "h-8 w-16")} />
          <div className={cn("rounded-full bg-orange-200", size === "sm" ? "h-10 w-10" : "h-16 w-16")} />
          <div className={cn("absolute bottom-0 rounded-b-full", outfit?.color, size === "sm" ? "h-6 w-12" : "h-10 w-20")} />
          {accessory?.id !== "accessory-none" && (
            <div className={cn("absolute", accessory?.color, size === "sm" ? "h-2 w-9" : "h-3 w-14")} />
          )}
          {effect?.id === "effect-spark" && <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-yellow-500" />}
        </div>
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", size === "sm" ? "text-sm" : "text-lg")}>
            {profile?.full_name || "CramDeck Student"}
          </p>
          <p className="truncate text-sm text-muted-foreground">{profile?.equipped_title || "Rookie Scholar"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hair?.label} · {outfit?.label} · {background?.label}
          </p>
        </div>
      </div>
    </div>
  );
}
