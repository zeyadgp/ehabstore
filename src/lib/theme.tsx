import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type NavKey =
  | "home"
  | "search"
  | "categories"
  | "cart"
  | "account"
  | "favorites"
  | "products"
  | "contact";

export type Theme = {
  id: string;
  name: string;
  is_default: boolean;
  primary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  card_color: string;
  radius: string;
  nav_position: "bottom" | "floating" | "top";
  nav_style: "pill" | "round" | "flat";
  show_labels: boolean;
  nav_items: NavKey[];
  sort_order: number;
  thumbnail?: string | null;
};

export const DEFAULT_NAV: NavKey[] = ["home", "search", "categories", "cart", "account"];

export async function fetchThemes(): Promise<Theme[]> {
  const { data } = await supabase.from("themes").select("*").order("sort_order");
  return ((data as unknown as Theme[] | null) ?? []).map((t) => ({
    ...t,
    nav_items: Array.isArray(t.nav_items) ? (t.nav_items as NavKey[]) : DEFAULT_NAV,
  }));
}

export const themesQuery = {
  queryKey: ["themes"],
  queryFn: fetchThemes,
  staleTime: 10 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};


export function useThemes() {
  return useQuery(themesQuery);
}

/** The theme marked as default drives the whole storefront look. */
export function useActiveTheme(): Theme | null {
  const { data = [] } = useThemes();
  return data.find((t) => t.is_default) ?? data[0] ?? null;
}

export function useInvalidateThemes() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["themes"] });
}

/** True when the theme background is dark (so text/surfaces must flip). */
function isDark(color: string) {
  const m = color.match(/oklch\(\s*([0-9.]+)/i);
  if (m) return Number(m[1]) < 0.5;
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1] as string, 16);
    const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    return lum < 0.5;
  }
  return false;
}

/** Applies theme colours as CSS variables on <html> (used live and for preview). */
export function applyThemeVars(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  const dark = isDark(theme.background_color);

  set("--primary", theme.primary_color);
  set("--primary-foreground", dark ? "oklch(0.16 0.02 280)" : "oklch(0.99 0.003 85)");
  set("--ring", theme.primary_color);
  set("--gold", theme.primary_color);
  set("--gold-soft", `color-mix(in oklab, ${theme.primary_color} 22%, ${theme.background_color})`);
  set("--accent", `color-mix(in oklab, ${theme.accent_color} 35%, ${theme.background_color})`);
  set("--accent-foreground", theme.foreground_color);
  set("--rose", theme.accent_color);
  set("--rose-soft", `color-mix(in oklab, ${theme.accent_color} 18%, ${theme.background_color})`);
  set("--secondary", `color-mix(in oklab, ${theme.accent_color} 22%, ${theme.background_color})`);
  set("--secondary-foreground", theme.foreground_color);
  set("--muted", `color-mix(in oklab, ${theme.foreground_color} 7%, ${theme.background_color})`);
  set(
    "--muted-foreground",
    `color-mix(in oklab, ${theme.foreground_color} 62%, ${theme.background_color})`,
  );
  set("--border", `color-mix(in oklab, ${theme.foreground_color} 14%, ${theme.background_color})`);
  set("--input", `color-mix(in oklab, ${theme.foreground_color} 14%, ${theme.background_color})`);
  set("--background", theme.background_color);
  set("--foreground", theme.foreground_color);
  set("--card", theme.card_color);
  set("--card-foreground", theme.foreground_color);
  set("--popover", theme.card_color);
  set("--popover-foreground", theme.foreground_color);
  set("--sidebar", theme.card_color);
  set("--sidebar-foreground", theme.foreground_color);
  set("--sidebar-primary", theme.primary_color);
  set("--sidebar-accent", `color-mix(in oklab, ${theme.accent_color} 25%, ${theme.background_color})`);
  set("--sidebar-accent-foreground", theme.foreground_color);
  set("--sidebar-border", `color-mix(in oklab, ${theme.foreground_color} 14%, ${theme.background_color})`);
  set("--radius", theme.radius);
  set(
    "--gradient-gold",
    `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})`,
  );
  set(
    "--gradient-soft",
    `linear-gradient(160deg, ${theme.background_color}, color-mix(in oklab, ${theme.accent_color} 18%, ${theme.background_color}))`,
  );
  root.classList.toggle("theme-dark", dark);
}
export const THEME_CACHE_KEY = "ehab-active-theme";

/** Persists the active theme so the next visit paints instantly, before the DB responds. */
export function cacheTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme));
  } catch {
    /* storage unavailable */
  }
}

export function readCachedTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Theme) : null;
  } catch {
    return null;
  }
}

/** Applies a theme immediately, skipping the colour transition (used on first paint). */
export function applyThemeInstantly(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("theme-switching-off");
  applyThemeVars(theme);
  requestAnimationFrame(() => root.classList.remove("theme-switching-off"));
}

/** Applies the active theme colours as CSS variables on <html>. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useActiveTheme();
  const booted = useRef(false);

  // Paint the last known theme before the network round-trip finishes.
  useLayoutEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const cached = readCachedTheme();
    if (cached) applyThemeInstantly(cached);
  }, []);

  useEffect(() => {
    if (!theme) return;
    applyThemeVars(theme);
    cacheTheme(theme);
  }, [theme]);



  return <>{children}</>;
}
