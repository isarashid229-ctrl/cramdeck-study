const CACHE_VERSION = "cramdeck-v4";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withScope = (path) => `${SCOPE_PATH}${path}`;

const APP_SHELL_URLS = [
  withScope("/"),
  withScope("/dashboard"),
  withScope("/demo"),
  withScope("/import"),
  withScope("/courses"),
  withScope("/assignments/new"),
  withScope("/calendar"),
  withScope("/study"),
  withScope("/test-me"),
  withScope("/games"),
  withScope("/avatar"),
  withScope("/rewards"),
  withScope("/settings"),
  withScope("/help"),
  withScope("/offline.html"),
  withScope("/manifest.json"),
  withScope("/manifest.webmanifest"),
  withScope("/icon.svg"),
  withScope("/icon-192.png"),
  withScope("/icon-512.png"),
  withScope("/icon-maskable-192.png"),
  withScope("/icon-maskable-512.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function isSupabaseOrApiRequest(url) {
  return url.pathname.startsWith("/api/") || url.hostname.includes("supabase.co");
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match(withScope("/offline.html"));
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetched = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetched;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isSupabaseOrApiRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath = event.notification.data?.url || withScope("/dashboard");
  const targetUrl = new URL(targetPath, self.location.origin).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => client.url === targetUrl);
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
