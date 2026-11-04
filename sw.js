self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
self.addEventListener("push", (event) => {
  let data = { title: "Desk", body: "" };
  try { data = event.data ? event.data.json() : data; } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title || "Desk", {
    body: data.body || "",
    data: data,
    icon: "/icons/icon-192.png",
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.openWindow(url));
});
