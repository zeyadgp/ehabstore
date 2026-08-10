import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart3,
  Coins,
  FileText,
  LayoutGrid,
  LogOut,
  Package,
  Search,
  Settings,
  SlidersHorizontal,
  ShoppingBag,
  Users,
  UserCog,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useSettings } from "@/lib/store";
import { SmartImage } from "@/components/SmartImage";
import { InternalSettingsCard } from "@/components/admin/InternalSettingsCard";

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

const nav: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[] = [
  { to: "/admin", label: "الإحصائيات", icon: BarChart3, exact: true },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/categories", label: "التصنيفات", icon: LayoutGrid },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/customers", label: "العملاء", icon: Users },
  { to: "/admin/currencies", label: "العملات", icon: Coins },
  { to: "/admin/content", label: "المحتوى والآراء", icon: FileText },
  { to: "/admin/seo", label: "تحسين الظهور", icon: Search },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
  { to: "/admin/users", label: "المستخدمون", icon: UserCog },
];

function AdminLayout() {
  const { loading, isAdmin, email } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showInternal, setShowInternal] = useState(false);

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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:py-6 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <div className="rounded-3xl border border-border bg-card p-3 shadow-soft sm:p-4 lg:sticky lg:top-24">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border pb-3">
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
            <button
              type="button"
              onClick={() => setShowInternal((v) => !v)}
              aria-expanded={showInternal}
              aria-label="الإعدادات الداخلية"
              title="الإعدادات الداخلية"
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border transition-colors ${
                showInternal ? "gradient-gold text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
          {showInternal && <InternalSettingsCard />}
          <nav className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                    active ? "gradient-gold text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0" /> <span className="truncate">تسجيل الخروج</span>
            </button>
          </nav>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}
