// Custom service-worker code. next-pwa compiles this directory and
// importScripts() it into the generated public/sw.js (customWorkerDir
// defaults to "worker") - not to be confused with /workers, the background
// job process.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "RCF E-Library";
  const options = {
    body: data.body || "",
    icon: "/icons/android-chrome-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: { url: data.url || "/dashboard/notifications" },
    tag: data.tag,
    // Re-alert when a tagged notification (e.g. a chat thread) is replaced
    renotify: Boolean(data.tag),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Reuse an open app window if there is one, instead of opening another
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          return client.focus().then((c) => (c && "navigate" in c ? c.navigate(target) : c));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

// The browser can rotate a subscription on its own; re-register the new one
// so the server doesn't keep pushing to a dead endpoint.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const sub =
        event.newSubscription ||
        (await self.registration.pushManager.subscribe(event.oldSubscription?.options ?? { userVisibleOnly: true }));
      await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sub.toJSON()),
      });
    })().catch(() => {}),
  );
});
