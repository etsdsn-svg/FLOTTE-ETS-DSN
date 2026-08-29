/* GestFlot — service worker
   ==========================
   Rôle unique : recevoir les notifications push envoyées par le serveur
   et les afficher, y compris quand l'application est fermée.

   CHOIX ASSUMÉ : ce service worker ne met RIEN en cache.

   Un service worker qui met l'application en cache la sert depuis le
   téléphone au lieu du réseau. C'est tentant (les 56 Ko d'images
   embarquées ne seraient plus rechargés à chaque visite), mais tant
   qu'une stratégie de mise à jour fiable n'est pas en place, cela ferait
   tourner les chauffeurs sur une ancienne version après chaque
   déploiement — sans qu'ils aient aucun moyen de s'en apercevoir.
   Un bug corrigé resterait présent sur leur téléphone.

   On s'en tient donc au strict nécessaire : le push. La mise en cache
   pourra s'ajouter plus tard, avec un numéro de version et un mécanisme
   de rafraîchissement explicite. */

const ICONE = "icone-192.png";

/* skipWaiting + claim : une nouvelle version du service worker prend la
   main immédiatement, au lieu d'attendre que tous les onglets soient
   fermés. Sans cela, une correction ici pourrait rester inactive
   plusieurs jours sur un téléphone jamais complètement fermé. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

/* Réception d'une notification.
   Le serveur envoie un objet JSON {titre, corps, tag}. On reste tolérant :
   si la charge utile est absente ou illisible, on affiche quand même
   quelque chose plutôt que rien — une notification muette serait plus
   déroutante qu'un message générique. */
self.addEventListener("push", e => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch (err) {
    d = { corps: e.data ? e.data.text() : "" };
  }

  const titre = d.titre || "GestFlot";
  const options = {
    body: d.corps || "Nouvelle activité sur la flotte.",
    icon: ICONE,
    badge: ICONE,
    lang: "fr",
    /* tag : deux notifications portant le même tag se remplacent au lieu
       de s'empiler. On regroupe par panne, pour qu'une discussion active
       ne noie pas l'écran de verrouillage sous dix notifications. */
    tag: d.tag || "gestflot",
    renotify: true,
    data: { url: d.url || "sablier2.html" }
  };

  e.waitUntil(self.registration.showNotification(titre, options));
});

/* Clic sur la notification : on ramène au premier plan une fenêtre
   GestFlot déjà ouverte s'il y en a une, sinon on en ouvre une. */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const cible = (e.notification.data && e.notification.data.url) || "sablier2.html";

  e.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });
    for (const f of fenetres) {
      if ("focus" in f) return f.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(cible);
  })());
});
