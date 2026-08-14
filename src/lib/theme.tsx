import { useEffect, type ReactNode } from "react";
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
};

export const DEFAULT_NAV: NavKey[] = ["home", "search", "categories", "cart", "account"];

export async function fetchThemes(): Promise<Theme[]> {
  const { data } = await supabase.from("themes").select("*").order("sort_order");
  return ((data as unknown as Theme[] | null) ?? []).map((t) => ({
    ...t,
    nav_items: Array.isArray(t.nav_items) ? (t.nav_items as NavKey[]) : DEFAULT_NAV,
  }));
}

export const themesQuery = { queryKey: ["themes"], queryFn: fetchThemes, staleTime: 60_000 };

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

/** Applies the active theme colours as CSS variables on <html>. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useActiveTheme();

  useEffect(() => {
    if (typeof document === "undefined" || !theme) return;
    const root = document.documentElement;
    const set = (k: string, v: string) => root.style.setProperty(k, v);
    set("--primary", theme.primary_color);
    set("--ring", theme.primary_color);
    set("--gold", theme.primary_color);
    set("--accent", theme.accent_color);
    set("--rose", theme.accent_color);
    set("--background", theme.background_color);
    set("--foreground", theme.foreground_color);
    set("--card", theme.card_color);
    set("--card-foreground", theme.foreground_color);
    set("--popover", theme.card_color);
    set("--popover-foreground", theme.foreground_color);
    set("--radius", theme.radius);
    set(
      "--gradient-gold",
      `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})`,
    );
  }, [theme]);

  return <>{children}</>;
}
