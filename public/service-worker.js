self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");
});

self.addEventListener("fetch", (event) => {
  // Simple fetch-through strategy (no caching for now to avoid complexity in this demo,
  // but enough to satisfy basic PWA requirements)
  event.respondWith(fetch(event.request));
});
