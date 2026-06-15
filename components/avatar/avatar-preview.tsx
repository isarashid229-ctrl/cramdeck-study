"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATAR_ITEMS, getAvatarConfig } from "@/lib/rewards";

type AvatarPreviewProps = {
  profile?: { avatar_config?: unknown; equipped_title?: string | null; full_name?: string | null } | null;
  size?: "sm" | "lg";
  reaction?: "idle" | "wave" | "celebrate" | "thoughtful" | "victory";
};

export function AvatarPreview({ profile, size = "lg", reaction = "idle" }: AvatarPreviewProps) {
  const avatar = getAvatarConfig(profile);
  const item = (id: string) => AVATAR_ITEMS.find((candidate) => candidate.id === id);
  const hair = item(avatar.hair);
  const face = item(avatar.face);
  const outfit = item(avatar.outfit);
  const accessory = item(avatar.accessory);
  const background = item(avatar.background);
  const effect = item(avatar.effect);
  const nameplate = item(avatar.nameplate);
  const badge = item(avatar.badge);
  const pet = item(avatar.pet);

  return (
    <div className={cn("rounded-2xl border p-4", background?.color || "bg-muted/40", size === "sm" && "p-3")}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "avatar-stage relative flex shrink-0 items-center justify-center rounded-full border-4 border-background shadow-lg",
            reaction === "wave" && "avatar-wave",
            reaction === "celebrate" && "avatar-celebrate",
            reaction === "victory" && "avatar-victory",
            size === "sm" ? "h-16 w-16" : "h-28 w-28"
          )}
        >
          {effect?.id !== "effect-none" && (
            <span className="absolute inset-[-8px] animate-pulse rounded-full bg-primary/20" />
          )}
          <div className={cn("absolute top-2 rounded-t-full", hair?.color, size === "sm" ? "h-5 w-10" : "h-8 w-16")} />
          <div className={cn("relative rounded-full", face?.color || "bg-orange-200", size === "sm" ? "h-10 w-10" : "h-16 w-16")}>
            <span className={cn("avatar-eye absolute rounded-full bg-slate-900", size === "sm" ? "left-2 top-4 h-1 w-1" : "left-4 top-6 h-1.5 w-1.5")} />
            <span className={cn("avatar-eye absolute rounded-full bg-slate-900", size === "sm" ? "right-2 top-4 h-1 w-1" : "right-4 top-6 h-1.5 w-1.5")} />
            <span className={cn("absolute rounded-full border-b-2 border-slate-800", reaction === "thoughtful" ? "bottom-3 left-1/2 h-2 w-4 -translate-x-1/2 rotate-180" : "bottom-3 left-1/2 h-2 w-5 -translate-x-1/2")} />
          </div>
          <div className={cn("absolute bottom-0 rounded-b-full", outfit?.color, size === "sm" ? "h-6 w-12" : "h-10 w-20")} />
          {accessory?.id !== "accessory-none" && (
            <div className={cn("absolute", accessory?.color, size === "sm" ? "h-2 w-9" : "h-3 w-14")} />
          )}
          {badge?.id !== "badge-rookie" && <span className={cn("absolute bottom-2 right-1 rounded-full border border-background", badge?.color, size === "sm" ? "h-3 w-3" : "h-5 w-5")} />}
          {pet?.id !== "pet-none" && <span className={cn("avatar-pet absolute -right-3 bottom-1 rounded-full border border-background", pet?.color, size === "sm" ? "h-4 w-4" : "h-7 w-7")} />}
          {effect?.id === "effect-spark" && <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-yellow-500" />}
        </div>
        <div className="min-w-0">
          <p className={cn("truncate rounded-lg px-2 py-1 font-semibold", nameplate?.color, size === "sm" ? "text-sm" : "text-lg")}>
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
