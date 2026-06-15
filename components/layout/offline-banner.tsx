"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm text-amber-950 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <WifiOff className="h-4 w-4" />
        You&apos;re offline. Some features may be unavailable.
      </div>
    </div>
  );
}
