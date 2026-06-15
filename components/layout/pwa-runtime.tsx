"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { initializeInstallTracking } from "@/lib/pwa/install";

const PREFETCH_ROUTES = [
  "/dashboard",
  "/assignments",
  "/courses",
  "/integrations",
  "/assignments/new",
  "/calendar",
  "/study",
  "/test-me",
  "/games",
  "/avatar",
  "/settings",
];

export function PwaRuntime() {
  const router = useRouter();

  useEffect(() => {
    initializeInstallTracking();

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const basePath = window.location.pathname.startsWith("/cramdeck-study") ? "/cramdeck-study" : "";
      navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch(() => {
        // The app still works as a website if service worker registration is blocked.
      });
    }

    const prefetch = () => PREFETCH_ROUTES.forEach((route) => router.prefetch(route));
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = globalThis.setTimeout(prefetch, 1200);
    return () => globalThis.clearTimeout(id);
  }, [router]);

  return null;
}
