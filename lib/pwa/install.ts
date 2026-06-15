"use client";

import { useEffect, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = {
  canInstall: boolean;
  installed: boolean;
  standalone: boolean;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let currentSnapshot: InstallState = {
  canInstall: false,
  installed: false,
  standalone: false,
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function snapshot(): InstallState {
  const standalone = isStandalone();
  const nextSnapshot = {
    canInstall: Boolean(deferredPrompt),
    installed: standalone || (typeof window !== "undefined" && window.localStorage.getItem("cramdeck-installed") === "true"),
    standalone,
  };
  if (
    currentSnapshot.canInstall !== nextSnapshot.canInstall ||
    currentSnapshot.installed !== nextSnapshot.installed ||
    currentSnapshot.standalone !== nextSnapshot.standalone
  ) {
    currentSnapshot = nextSnapshot;
  }
  return currentSnapshot;
}

function serverSnapshot(): InstallState {
  return currentSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function initializeInstallTracking() {
  if (typeof window === "undefined") return;
  if ((window as Window & { __cramdeckInstallTracking?: boolean }).__cramdeckInstallTracking) return;
  (window as Window & { __cramdeckInstallTracking?: boolean }).__cramdeckInstallTracking = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.localStorage.setItem("cramdeck-installed", "true");
    notify();
  });
}

export function useInstallApp() {
  useEffect(() => initializeInstallTracking(), []);

  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === "accepted") {
      window.localStorage.setItem("cramdeck-installed", "true");
    }
    notify();
    return choice.outcome === "accepted";
  };

  return { ...state, install };
}
