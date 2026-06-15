export type AppPlatform = "web" | "pwa" | "native";

export type AppCapabilities = {
  platform: AppPlatform;
  standalone: boolean;
  offlineCache: boolean;
  browserNotifications: boolean;
  pushNotifications: boolean;
  fileUploads: boolean;
};

export function getAppCapabilities(): AppCapabilities {
  if (typeof window === "undefined") {
    return {
      platform: "web",
      standalone: false,
      offlineCache: false,
      browserNotifications: false,
      pushNotifications: false,
      fileUploads: true,
    };
  }

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return {
    platform: standalone ? "pwa" : "web",
    standalone,
    offlineCache: "serviceWorker" in navigator && "caches" in window,
    browserNotifications: "Notification" in window,
    pushNotifications: "PushManager" in window,
    fileUploads: true,
  };
}
