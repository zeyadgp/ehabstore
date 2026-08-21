import { useEffect } from "react";
import { useSettings, useSignedImages } from "@/lib/store";

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * The dashboard logo drives the browser tab icon, the iOS touch icon and the
 * PWA manifest icons. Falls back to the bundled icons when no logo is set.
 */
export function AppIcons() {
  const { data: settings } = useSettings();
  const logo = settings?.logo ?? null;
  const { data: urls } = useSignedImages(logo ? [logo] : []);
  const logoUrl = urls?.[0];
  const name = settings?.store_name ?? "إيهاب ستور";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const icon = logoUrl ?? "/favicon.png";
    setLink("icon", icon);
    setLink("apple-touch-icon", logoUrl ?? "/icon-192.png");

    const manifest = {
      name,
      short_name: name,
      start_url: "/",
      display: "standalone",
      background_color: "#fffdf8",
      theme_color: "#c9a227",
      dir: "rtl",
      lang: "ar",
      icons: logoUrl
        ? [
            { src: logoUrl, sizes: "192x192", type: "image/png", purpose: "any" },
            { src: logoUrl, sizes: "512x512", type: "image/png", purpose: "any" },
          ]
        : [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
    const url = URL.createObjectURL(blob);
    setLink("manifest", url);
    return () => URL.revokeObjectURL(url);
  }, [logoUrl, name]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);

  return null;
}
