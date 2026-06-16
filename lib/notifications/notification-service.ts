"use client";

export type NotificationIntent = "assignment_due" | "quiz_reminder" | "study_streak" | "weak_topic";

export type EagleCramNotification = {
  intent: NotificationIntent;
  title: string;
  body: string;
  url?: string;
  scheduledFor?: string;
};

export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported" as const;
  }
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  return Notification.requestPermission();
}

export async function sendBrowserNotification(notification: EagleCramNotification) {
  const permission = await requestBrowserNotificationPermission();
  if (permission !== "granted") return false;

  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
  if (registration) {
    await registration.showNotification(notification.title, {
      body: notification.body,
      icon: "/icon-192.png",
      badge: "/icon-maskable-192.png",
      data: { url: notification.url || "/dashboard", intent: notification.intent },
    });
    return true;
  }

  const browserNotification = new Notification(notification.title, {
    body: notification.body,
    icon: "/icon-192.png",
    data: { url: notification.url || "/dashboard", intent: notification.intent },
  });
  browserNotification.onclick = () => {
    window.focus();
    window.location.href = notification.url || "/dashboard";
  };
  return true;
}

export function buildReminderExamples(): EagleCramNotification[] {
  return [
    {
      intent: "assignment_due",
      title: "Assignment due soon",
      body: "Open EagleCram to review your next deadline.",
      url: "/dashboard",
    },
    {
      intent: "quiz_reminder",
      title: "Ready for a quick review?",
      body: "Take a short Test Me set to keep your memory fresh.",
      url: "/test-me",
    },
    {
      intent: "study_streak",
      title: "Keep your study streak",
      body: "Finish one focused study session today.",
      url: "/study",
    },
    {
      intent: "weak_topic",
      title: "Weak topic review",
      body: "Review missed questions and save a flashcard.",
      url: "/study",
    },
  ];
}
