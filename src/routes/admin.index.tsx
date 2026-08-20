import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  PackageCheck,
  Package,
  PhoneOff,
  ShoppingBag,
  Truck,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  statusColor,
  statusLabels,
  useAllProducts,
  useOrderItems,
  useOrders,
  useAdminCurrency,
  type Order,
} from "@/lib/admin";
import { formatMoney } from "@/lib/store";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const DAY = 86400000;

function AdminHome() {
  const { data: orders = [] } = useOrders();
  const { data: items = [] } = useOrderItems();
  const { data: products = [] } = useAllProducts();
  const { label } = useAdminCurrency();

  const live = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
  const revenue = live.reduce((s, o) => s + Number(o.total), 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySales = live
    .filter((o) => o.created_at.slice(0, 10) === todayKey)
    .reduce((s, o) => s + Number(o.total), 0);

  const count = (fn: (o: Order) => boolean) => orders.filter(fn).length;
  const pendingPayments = orders.filter((o) => o.payment_status === "pending");
  const noContact = orders.filter((o) => o.status === "no_contact");
  const awaiting = orders.filter((o) => o.status === "new" || o.status === "reviewing");
  const late = orders.filter(
    (o) =>
      !["completed", "delivered", "cancelled", "returned"].includes(o.status) &&
      Date.now() - new Date(o.created_at).getTime() > 2 * DAY,
  );
  const lowStock = products.filter((p) => p.stock <= 3);

  const firstOrderByPhone = new Map<string, string>();
  [...orders]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .forEach((o) => {
      if (!firstOrderByPhone.has(o.phone)) firstOrderByPhone.set(o.phone, o.created_at);
    });
  const newCustomers = [...firstOrderByPhone.values()].filter(
    (d) => Date.now() - new Date(d).getTime() < 30 * DAY,
  ).length;

  const byDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  live.forEach((o) => {
    const key = o.created_at.slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + Number(o.total));
  });
  const chartData = [...byDay.entries()].map(([day, total]) => ({
    day: new Date(day).toLocaleDateString("ar-EG", { weekday: "short" }),
    total,
  }));

  const soldCount = new Map<string, number>();
  items.forEach((i) => soldCount.set(i.product_name, (soldCount.get(i.product_name) ?? 0) + i.quantity));
  const top = [...soldCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">نظرة عامة</h1>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ShoppingBag} label="إجمالي الطلبات" value={String(orders.length)} />
        <Stat icon={Wallet} label="مبيعات اليوم" value={formatMoney(todaySales, label)} />
        <Stat icon={Wallet} label="إجمالي المبيعات" value={formatMoney(revenue, label)} />
        <Stat icon={UserPlus} label="عملاء جدد (30 يوم)" value={String(newCustomers)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Mini icon={Clock} label="طلبات جديدة" value={count((o) => o.status === "new")} tone="text-blue-600" />
        <Mini icon={Package} label="قيد التجهيز" value={count((o) => o.status === "processing")} tone="text-purple-600" />
        <Mini icon={Truck} label="تم الشحن" value={count((o) => o.status === "shipped")} tone="text-cyan-600" />
        <Mini icon={CheckCircle2} label="مكتملة" value={count((o) => o.status === "completed")} tone="text-emerald-600" />
        <Mini icon={XCircle} label="ملغية" value={count((o) => o.status === "cancelled")} tone="text-rose-600" />
        <Mini icon={CreditCard} label="مدفوعات معلقة" value={pendingPayments.length} tone="text-amber-600" />
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-bold">مبيعات آخر 7 أيام</h2>
        <div className="mt-4 h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatMoney(Number(v), label)} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FollowUp title="طلبات بدون تواصل" icon={PhoneOff} orders={noContact} label={label} />
        <FollowUp title="بانتظار التأكيد" icon={Clock} orders={awaiting} label={label} />
        <FollowUp title="طلبات متأخرة (أكثر من يومين)" icon={AlertTriangle} orders={late} label={label} />
        <FollowUp title="مدفوعات بانتظار المراجعة" icon={CreditCard} orders={pendingPayments} label={label} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">أحدث الطلبات</h2>
            <Link to="/admin/orders" className="text-xs font-bold text-primary">عرض الكل</Link>
          </div>
          <ul className="mt-3 divide-y divide-border text-sm">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                <span className="font-bold">#{o.order_number}</span>
                <span className="truncate text-muted-foreground">{o.customer_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusColor[o.status]}`}>
                  {statusLabels[o.status]}
                </span>
                <span className="text-xs font-bold">{formatMoney(Number(o.total), label)}</span>
              </li>
            ))}
            {orders.length === 0 && <li className="py-3 text-xs text-muted-foreground">لا توجد طلبات بعد</li>}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-base font-bold">الأكثر مبيعاً</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {top.map(([name, qty]) => (
              <li key={name} className="flex items-center justify-between py-2">
                <span className="truncate">{name}</span>
                <span className="text-xs font-bold text-primary">{qty} قطعة</span>
              </li>
            ))}
            {top.length === 0 && <li className="py-3 text-xs text-muted-foreground">لا توجد مبيعات بعد</li>}
          </ul>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-800">
            <PackageCheck className="h-4 w-4" /> منتجات على وشك النفاد
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {lowStock.map((p) => (
              <li key={p.id} className="rounded-full bg-white px-3 py-1 font-bold text-amber-800">
                {p.name} — {p.stock}
              </li>
            ))}
          </ul>
          <Link to="/admin/inventory" className="mt-3 inline-block text-xs font-bold text-amber-900 underline">
            إدارة المخزون
          </Link>
        </div>
      )}
    </div>
  );
}

function FollowUp({
  title,
  icon: Icon,
  orders,
  label,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  orders: Order[];
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold">{orders.length}</span>
      </div>
      <ul className="mt-3 divide-y divide-border text-xs">
        {orders.slice(0, 5).map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-2 py-2">
            <span className="font-bold">#{o.order_number}</span>
            <span className="truncate text-muted-foreground">{o.customer_name}</span>
            <span className="font-bold">{formatMoney(Number(o.total), o.currency_label ?? label)}</span>
          </li>
        ))}
        {orders.length === 0 && <li className="py-3 text-muted-foreground">لا يوجد ما يحتاج إجراء 👌</li>}
      </ul>
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <Icon className={`h-4 w-4 ${tone}`} />
      <p className="mt-2 text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}
