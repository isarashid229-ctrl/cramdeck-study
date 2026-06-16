import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EagleMark } from "@/components/brand/eaglecram-logo";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}

export function AppLoadingScreen({ label = "Loading EagleCram..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <EagleMark className="mx-auto mb-5 h-14 w-14 rounded-2xl" />
        <h1 className="text-lg font-semibold">EagleCram</h1>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <Skeleton className="h-11 w-11 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            <Skeleton className="mx-auto h-4 w-36" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      <CardListSkeleton />
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
