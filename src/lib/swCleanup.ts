/**
 * Removes stale/broken service workers.
 *
 * A previous deploy registered `/sw.js`, which now returns 404 in some
 * environments. A broken registration keeps intercepting fetches and makes
 * requests (like Supabase auth) fail with "Failed to fetch".
 */
export async function cleanupStaleServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      const scriptURL =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL;

      if (!scriptURL) continue;

      try {
        const res = await fetch(scriptURL, { cache: "no-store" });
        if (res.ok) continue;
      } catch {
        // network error fetching the SW script -> treat as broken
      }

      console.warn("[PWA] Removendo service worker inválido:", scriptURL);
      await registration.unregister();

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    }
  } catch (e) {
    console.warn("[PWA] Falha ao limpar service workers:", e);
  }
}
