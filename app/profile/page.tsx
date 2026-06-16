"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ShopSkeleton, Skeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarPreview } from "@/components/avatar/avatar-preview";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";
import { useProfile } from "@/lib/hooks/use-assignments";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Trophy } from "lucide-react";
import { useEffect } from "react";
import { friendlyErrorMessage } from "@/lib/friendly-error";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const GRADE_LEVELS = [
  "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade",
  "11th Grade", "12th Grade", "College Freshman", "College Sophomore",
  "College Junior", "College Senior", "Graduate",
];

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      school_name: "",
      grade_level: "",
      timezone: "America/New_York",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        school_name: profile.school_name || "",
        grade_level: profile.grade_level || "",
        timezone: profile.timezone || "America/New_York",
      });
    }
  }, [profile, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(values)
      .eq("id", user.id);

    if (error) {
      toast.error(friendlyErrorMessage(error, "Could not update profile."));
      return;
    }

    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  });

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <ShopSkeleton />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your profile, points, title, and EagleCram identity.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <AvatarPreview profile={profile} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rewards profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <Coins className="mb-2 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{Number(profile?.points ?? 0)}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div className="rounded-xl border p-4">
                <Trophy className="mb-2 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{Number(profile?.streak_count ?? 0)}</p>
                <p className="text-sm text-muted-foreground">Streak</p>
              </div>
              <div className="rounded-xl border p-4">
                <Badge>{profile?.equipped_title || "Rookie Scholar"}</Badge>
                <p className="mt-3 text-sm text-muted-foreground">Equipped title</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Full name</Label>
                <Input className="mt-2" {...form.register("full_name")} />
                {form.formState.errors.full_name && (
                  <p className="mt-1 text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div>
                <Label>School name</Label>
                <Input className="mt-2" placeholder="e.g. Lincoln High School" {...form.register("school_name")} />
              </div>
              <div>
                <Label>Grade level</Label>
                <Select
                  value={form.watch("grade_level") || ""}
                  onValueChange={(v) => form.setValue("grade_level", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select
                  value={form.watch("timezone")}
                  onValueChange={(v) => form.setValue("timezone", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
