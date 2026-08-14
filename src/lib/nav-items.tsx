import { Home, Heart, LayoutGrid, Search, ShoppingBag, Store, UserRound, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import type { NavKey } from "@/lib/theme";

export type NavEntry = {
  key: NavKey;
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  search?: Record<string, string>;
  badge: number;
};

export const NAV_LABELS: Record<NavKey, string> = {
  home: "الرئيسية",
  search: "البحث",
  categories: "الأقسام",
  cart: "السلة",
  account: "الحساب",
  favorites: "المفضلة",
  products: "المتجر",
  contact: "تواصل",
};

/** Builds the navigation entries in the order the active theme defines. */
export function useNavEntries(keys: NavKey[]): NavEntry[] {
  const { count } = useCart();
  const { ids } = useFavorites();

  const all: Record<NavKey, NavEntry> = {
    home: { key: "home", to: "/", label: NAV_LABELS.home, icon: Home, badge: 0 },
    search: {
      key: "search",
      to: "/products",
      label: NAV_LABELS.search,
      icon: Search,
      search: { filter: "1" },
      badge: 0,
    },
    categories: { key: "categories", to: "/categories", label: NAV_LABELS.categories, icon: LayoutGrid, badge: 0 },
    cart: { key: "cart", to: "/cart", label: NAV_LABELS.cart, icon: ShoppingBag, badge: count },
    account: { key: "account", to: "/account", label: NAV_LABELS.account, icon: UserRound, badge: 0 },
    favorites: { key: "favorites", to: "/favorites", label: NAV_LABELS.favorites, icon: Heart, badge: ids.length },
    products: { key: "products", to: "/products", label: NAV_LABELS.products, icon: Store, badge: 0 },
    contact: { key: "contact", to: "/contact", label: NAV_LABELS.contact, icon: MessageCircle, badge: 0 },
  };

  return keys.map((k) => all[k]).filter(Boolean);
}
