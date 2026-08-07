/* GestFlot — service worker.
   Son seul rôle : afficher les notifications quand l'application est fermée. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = { titre: "GestFlot", corps: "Nouvelle activité sur la flotte" };
  try { if (e.data) d = Object.assign(d, e.data.json()); } catch (_) {
    try { d.corps = e.data.text(); } catch (_) {}
  }

  const urgent = d.evenement === "signalee";
  e.waitUntil(
    self.registration.showNotification(d.titre, {
      body: d.corps,
      tag: d.panne_id || "sablier",       // une seule notification par panne
      renotify: true,
      requireInteraction: urgent,          // reste affichée tant qu'on ne la touche pas
      vibrate: urgent ? [200, 100, 200] : [100],
      data: { panne_id: d.panne_id || null },
      badge: "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%2317453A"/></svg>'),
      icon: "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" rx="12" fill="#17453A"/>' +
        '<rect x="22" y="14" width="20" height="36" rx="3" fill="#D2A24C"/>' +
        '<rect x="22" y="14" width="20" height="14" rx="3" fill="#E4E4DF"/></svg>'),
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const cible = new URL(self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((liste) => {
      for (const c of liste) {
        if (c.url.startsWith(cible) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(cible);
    })
  );
});
