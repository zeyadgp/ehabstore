import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useOrders } from "@/lib/admin";
import { formatMoney, useSettings } from "@/lib/store";
import { whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

function AdminCustomers() {
  const { data: orders = [] } = useOrders();
  const { label } = useAdminCurrency();

  const map = new Map<
    string,
    { name: string; phone: string; city: string; count: number; total: number; last: string }
  >();
  orders.forEach((o) => {
    const key = o.phone;
    const prev = map.get(key);
    map.set(key, {
      name: o.customer_name,
      phone: o.phone,
      city: o.city,
      count: (prev?.count ?? 0) + 1,
      total: (prev?.total ?? 0) + Number(o.total),
      last: prev?.last && prev.last > o.created_at ? prev.last : o.created_at,
    });
  });
  const customers = [...map.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">العملاء</h1>
      <p className="text-xs text-muted-foreground">{customers.length} عميل سجّلوا طلبات في المتجر</p>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="bg-secondary/60 text-xs">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">الهاتف</th>
              <th className="p-3">المدينة</th>
              <th className="p-3">عدد الطلبات</th>
              <th className="p-3">إجمالي الشراء</th>
              <th className="p-3">آخر طلب</th>
              <th className="p-3">تواصل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.phone}>
                <td className="p-3 font-bold">{c.name}</td>
                <td className="p-3 text-xs" dir="ltr">{c.phone}</td>
                <td className="p-3 text-xs">{c.city}</td>
                <td className="p-3 text-xs">{c.count}</td>
                <td className="p-3 text-xs font-bold">{formatMoney(c.total, label)}</td>
                <td className="p-3 text-[11px] text-muted-foreground">
                  {new Date(c.last).toLocaleDateString("ar-EG")}
                </td>
                <td className="p-3">
                  <a
                    href={whatsappLink(c.phone, `مرحباً ${c.name} 🌸`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg bg-[#25D366] p-2 text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">لا يوجد عملاء بعد</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
