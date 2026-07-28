// Kill-switch for the old app's service worker. Any device that still has
// the old SW registered fetches this file on its next update check; this
// version unregisters itself, wipes its caches, and reloads open pages.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
