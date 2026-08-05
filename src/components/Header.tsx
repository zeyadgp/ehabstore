import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/store";

const navLinks = [
  { to: "/", label: "الرئيسية" },
  { to: "/products", label: "المنتجات" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { data: settings } = useSettings();
  const storeName = settings?.store_name ?? "إيهاب ستور للعناية والتجميل";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:h-20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt={storeName} className="h-10 w-10 md:h-12 md:w-12" width={48} height={48} />
          <span className="text-sm font-extrabold leading-tight text-foreground md:text-lg">
            {storeName}
          </span>
        </Link>

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

        <div className="flex items-center gap-2">
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
          </div>
        </nav>
      )}
    </header>
  );
}