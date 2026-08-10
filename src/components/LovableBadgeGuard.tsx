import { useEffect } from "react";
import { useSettings } from "@/lib/store";

const SELECTORS = [
  "#lovable-badge",
  "[data-lovable-badge]",
  "lovable-badge",
  'a[href*="lovable.dev"]',
  'a[href*="lovable.app/projects"]',
];

const STYLE_ID = "lovable-badge-guard";

/** Hides the "Edit with Lovable" badge unless the admin turns it back on. */
export function LovableBadgeGuard() {
  const { data: settings } = useSettings();
  const hidden = settings?.hide_lovable_badge !== false;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.getElementById(STYLE_ID);
    if (!hidden) {
      existing?.remove();
      return;
    }
    const style = existing ?? document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `${SELECTORS.join(",")}{display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;}`;
    if (!existing) document.head.appendChild(style);

    const sweep = () => {
      SELECTORS.forEach((sel) => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          el.style.display = "none";
        });
      });
    };
    sweep();
    const observer = new MutationObserver(sweep);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [hidden]);

  return null;
}