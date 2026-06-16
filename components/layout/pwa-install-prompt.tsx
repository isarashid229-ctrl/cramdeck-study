"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallApp } from "@/lib/pwa/install";

export function PwaInstallPrompt() {
  const { canInstall, installed, install } = useInstallApp();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(window.localStorage.getItem("cramdeck-install-dismissed") === "true");
  }, []);

  if (!canInstall || installed || dismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem("cramdeck-install-dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-xs rounded-2xl border bg-card p-3 text-card-foreground shadow-lg lg:bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install EagleCram</p>
          <p className="mt-1 text-xs text-muted-foreground">Open faster from your device home screen.</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await install();
              }}
            >
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss install prompt">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
