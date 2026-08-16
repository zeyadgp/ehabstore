import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Menu, ShieldCheck, ShoppingBag, UserRound, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { BrandMark } from "@/components/BrandMark";
import { useFavorites } from "@/lib/favorites";

const navLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/products", label: "المنتجات" },
  { to: "/categories", label: "الأقسام" },
  { to: "/favorites", label: "المفضلة" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { code, setCode, currencies } = useCurrency();
  const { ids: favIds } = useFavorites();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-4 md:h-20 md:flex md:justify-between">
        <BrandMark size="md" />

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-primary" }}
              className="text-sm font-bold text-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {currencies.length > 1 && (
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-label="اختيار العملة"
              className="hidden h-11 rounded-full border border-border bg-card px-3 text-xs font-bold text-foreground outline-none focus:border-primary sm:block"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <Link
            to="/favorites"
            className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary sm:flex"
            aria-label="المفضلة"
          >
            <Heart className="h-5 w-5 text-foreground" />
            {favIds.length > 0 && (
              <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[11px] font-bold text-primary-foreground">
                {favIds.length}
              </span>
            )}
          </Link>
          <Link
            to="/account"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary sm:flex"
            aria-label="حسابي"
          >
            <UserRound className="h-5 w-5 text-foreground" />
          </Link>
          <Link
            to="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary"
            aria-label="سلة المشتريات"
          >
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {count > 0 && (
              <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card md:hidden"
            aria-label="القائمة"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {currencies.length > 1 && (
              <select
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-label="اختيار العملة"
                className="my-2 h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary sm:hidden"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-sm font-bold text-foreground last:border-0"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-secondary/50 py-3 text-xs font-bold text-primary"
            >
              <ShieldCheck className="h-4 w-4" /> دخول الأدمن
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}