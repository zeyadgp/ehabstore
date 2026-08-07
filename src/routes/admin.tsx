import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  FileText,
  LayoutGrid,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Users,
  UserCog,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "@/assets/logo.png";

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

const nav = [
  { to: "/admin", label: "الإحصائيات", icon: BarChart3, exact: true },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/categories", label: "التصنيفات", icon: LayoutGrid },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/customers", label: "العملاء", icon: Users },
  { to: "/admin/content", label: "المحتوى والآراء", icon: FileText },
  { to: "/admin/seo", label: "تحسين الظهور", icon: Search },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
  { to: "/admin/users", label: "المستخدمون", icon: UserCog },
] as const;

function AdminLayout() {
  const { loading, isAdmin, email } = useAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-6 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <img src={logo} alt="إيهاب ستور" width={36} height={36} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">لوحة التحكم</p>
              <p dir="ltr" className="truncate text-[11px] text-muted-foreground">{email}</p>
            </div>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                    active ? "gradient-gold text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> تسجيل الخروج
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
