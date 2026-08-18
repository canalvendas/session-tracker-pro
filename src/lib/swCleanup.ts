/**
 * Service worker hygiene.
 *
 * Old deploys registered a `/sw.js` that no longer exists (404). A broken
 * registration keeps intercepting fetches and makes backend/auth requests fail
 * with "Failed to fetch".
 */

export function isPreviewHost() {
  return (
    typeof window !== "undefined" &&
    /(^|\.)lovable\.app$/.test(window.location.hostname) &&
    window.location.hostname.includes("preview")
  );
}

export async function unregisterAllServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn("[PWA] Falha ao remover service workers:", e);
  }
}

export async function cleanupStaleServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  // No preview do editor o SW só causa problemas (scripts antigos em 404).
  if (isPreviewHost()) {
    await unregisterAllServiceWorkers();
    return;
  }

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
        // erro de rede ao buscar o script -> considerado inválido
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
