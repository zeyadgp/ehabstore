import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, SlidersHorizontal, ShoppingBag, Store, UserRound } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";

/** Icon-only quick navigation shown at the bottom on mobile and inside the footer. */
export function useBottomItems() {
  const { count } = useCart();
  const { ids } = useFavorites();
  return [
    { key: "store", to: "/products", label: "المتجر", icon: Store, badge: 0, search: undefined },
    {
      key: "filter",
      to: "/products",
      label: "الفلتر",
      icon: SlidersHorizontal,
      badge: 0,
      search: { category: "", q: "", sort: "newest", filter: "1" },
    },
    { key: "fav", to: "/favorites", label: "المفضلة", icon: Heart, badge: ids.length, search: undefined },
    { key: "cart", to: "/cart", label: "السلة", icon: ShoppingBag, badge: count, search: undefined },
    { key: "account", to: "/account", label: "حسابي", icon: UserRound, badge: 0, search: undefined },
  ] as const;
}

export function BottomBar() {
  const items = useBottomItems();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <li key={item.key}>
              <Link
                to={item.to}
                search={item.search as never}
                className="flex flex-col items-center gap-1 py-2.5"
                aria-label={item.label}
              >
                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                    active ? "gradient-gold text-primary-foreground shadow-soft" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
