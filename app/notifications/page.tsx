"use client";

import { Bell, CheckCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { Skeleton } from "@/components/layout/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { isMissingSchemaError } from "@/lib/hooks/use-assignments";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export default function NotificationsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, assignment_id, type, message, scheduled_for, is_read, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      return data;
    },
  });

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) toast.error(friendlyErrorMessage(error, "Could not update notifications."));
    else {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-muted-foreground">Deadline reminders and updates.</p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="flex items-start gap-4 p-4">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="You'll see deadline reminders and assignment updates here when they're scheduled."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={notification.is_read ? "opacity-60" : "border-primary/20"}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">
                      {notification.type} · {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
