"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isMissingSchemaError } from "@/lib/hooks/use-assignments";
import { Button } from "@/components/ui/button";

export function DatabaseSetupAlert() {
  const supabase = createClient();

  const { data: needsSetup = false } = useQuery({
    queryKey: ["database-setup-status"],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { error } = await supabase.from("courses").select("id, subject, description", { head: true, count: "exact" });
      if (!error) return false;
      if (isMissingSchemaError(error)) return true;
      return false;
    },
  });

  if (!needsSetup) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-900 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Database setup required</p>
            <p className="text-amber-800/80 dark:text-amber-100/80">
              Your app UI is ready, but Supabase tables have not been created yet. Run{" "}
              <code>supabase/schema.sql</code>, then <code>supabase/policies.sql</code>, in the Supabase SQL Editor.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-amber-500/40 bg-background/70" asChild>
          <Link href="/setup">View setup instructions</Link>
        </Button>
      </div>
    </div>
  );
}
