/**
 * Single guarded service-worker registration.
 *
 * The SW is only registered on the real published site: never in dev, never in
 * the Lovable preview (which runs the app inside an iframe on a *.lovable.app
 * preview host), and never when the browser has no SW support. Visitors that
 * already picked up the old hand-written /sw.js get it cleaned up instead.
 */
function isPreviewSurface(): boolean {
  const host = window.location.hostname;
  const framed = window.parent && window.parent !== window;
  const previewHost =
    host.includes("lovableproject.com") ||
    host.includes("lovable.dev") ||
    host.includes("gptengineer") ||
    /(^|\.)id-preview/.test(host) ||
    host.endsWith("-dev.lovable.app") ||
    host === "localhost" ||
    host === "127.0.0.1";
  return Boolean(framed) || previewHost;
}

async function unregisterAll() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    // Drop the caches created by the previous hand-written service worker.
    await Promise.all(keys.filter((k) => k.startsWith("ehab-store-")).map((k) => caches.delete(k)));
  }
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV || isPreviewSurface()) {
    void unregisterAll().catch(() => {});
    return;
  }

  const start = () => {
    void (async () => {
      try {
        // Remove the legacy cache buckets from the old manual worker once.
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(
            keys.filter((k) => k.startsWith("ehab-store-")).map((k) => caches.delete(k)),
          );
        }
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        /* offline or unsupported — nothing to do */
      }
    })();
  };

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
