import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  CreditCard,
  Database,
  Menu,
  Receipt,
  Truck,
  X,
  BarChart3,
  Coins,
  Gift,
  FileText,
  Megaphone,
  LayoutGrid,
  LogOut,
  Package,
  SlidersHorizontal,
  Ticket,
  ShoppingBag,
  Users,
  UserCog,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useSettings } from "@/lib/store";
import { SmartImage } from "@/components/SmartImage";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم | إيهاب ستور" },
      { name: "description", content: "لوحة تحكم إدارة متجر إيهاب ستور: المنتجات والطلبات والإعدادات." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة التحكم | إيهاب ستور" },
      { property: "og:description", content: "إدارة متجر إيهاب ستور للعناية والتجميل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "إدارة المتجر",
    items: [
      { to: "/admin", label: "الإحصائيات", icon: BarChart3, exact: true },
      { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
      { to: "/admin/products", label: "المنتجات", icon: Package },
      { to: "/admin/categories", label: "التصنيفات", icon: LayoutGrid },
      { to: "/admin/customers", label: "العملاء", icon: Users },
      { to: "/admin/inventory", label: "المخزون", icon: Boxes },
    ],
  },
  {
    title: "التسويق",
    items: [
      { to: "/admin/banners", label: "العروض والإعلانات", icon: Megaphone },
      { to: "/admin/coupons", label: "كوبونات الخصم", icon: Ticket },
      { to: "/admin/loyalty", label: "الولاء", icon: Gift },
      { to: "/admin/content", label: "المحتوى والآراء", icon: FileText },
    ],
  },
  {
    title: "الإدارة",
    items: [
      { to: "/admin/invoices", label: "الفواتير", icon: Receipt },
      { to: "/admin/payments", label: "الدفع", icon: CreditCard },
      { to: "/admin/delivery", label: "التوصيل", icon: Truck },
      { to: "/admin/currencies", label: "العملات", icon: Coins },
      { to: "/admin/appearance", label: "الإعدادات والمظهر", icon: SlidersHorizontal },
      { to: "/admin/data", label: "استيراد وتصدير", icon: Database },
      { to: "/admin/users", label: "المستخدمون", icon: UserCog },
    ],
  },
];

function AdminLayout() {
  const { loading, isAdmin, email } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">جاري التحقق…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">لوحة التحكم</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {email ? "حسابك لا يملك صلاحية الدخول للوحة التحكم." : "يجب تسجيل الدخول للوصول للوحة التحكم."}
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-block rounded-xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          الذهاب لتسجيل الدخول
        </Link>
      </div>
    );
  }

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const navList = (
    <nav className="space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-2 pb-1 text-[11px] font-bold text-muted-foreground">{g.title}</p>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
            {g.items.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                    active ? "gradient-gold text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <button
        onClick={signOut}
        className="flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 shrink-0" /> <span className="truncate">تسجيل الخروج</span>
      </button>
    </nav>
  );

  const brand = (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b border-border pb-3">
      <SmartImage
        paths={settings?.logo ? [settings.logo] : []}
        fallback="/favicon.png"
        alt={settings?.store_name ?? "إيهاب ستور"}
        className="h-9 w-9 shrink-0 rounded-lg object-contain"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold">لوحة التحكم</p>
        <p dir="ltr" className="truncate text-[11px] text-muted-foreground">{email}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:py-6 lg:flex-row">
      <button
        onClick={() => setMenuOpen(true)}
        className="flex items-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold shadow-soft lg:hidden"
      >
        <Menu className="h-4 w-4" /> القائمة
      </button>

      <aside className="hidden lg:block lg:w-60 lg:shrink-0">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft lg:sticky lg:top-24">
          {brand}
          <div className="mt-3">{navList}</div>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="إغلاق القائمة"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 end-0 w-72 max-w-[85%] overflow-y-auto bg-card p-4 shadow-xl">
            <div className="mb-2 flex justify-end">
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-1 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            {brand}
            <div className="mt-3">{navList}</div>
          </div>
        </div>
      )}

      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}
