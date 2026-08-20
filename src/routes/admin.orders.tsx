import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { syncOrderPoints } from "@/lib/loyalty.functions";
import {
  statusColor,
  statusLabels,
  statusOrder,
  useOrderItems,
  useOrders,
  type Order,
  type OrderStatus,
} from "@/lib/admin";
import { formatMoney, useSettings } from "@/lib/store";
import { whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [] } = useOrders();
  const { data: items = [] } = useOrderItems();
  const { label } = useAdminCurrency();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const syncPoints = useServerFn(syncOrderPoints);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "orders"] });

  const setStatus = async (o: Order, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث حالة الطلب");
    if (status === "completed" || status === "cancelled") {
      try {
        const res = await syncPoints({ data: { orderId: o.id, status } });
        if (res.ok && res.points > 0) toast.success(`تم اعتماد ${res.points} نقطة ولاء للعميل`);
        if (res.ok && res.points < 0) toast.info("تم إلغاء نقاط هذا الطلب");
        await qc.invalidateQueries({ queryKey: ["admin", "loyalty-accounts"] });
      } catch {
        /* نظام الولاء اختياري */
      }
    }
    await refresh();
  };

  const remove = async (o: Order) => {
    if (!confirm(`حذف الطلب #${o.order_number}؟`)) return;
    await supabase.from("order_items").delete().eq("order_id", o.id);
    const { error } = await supabase.from("orders").delete().eq("id", o.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    await refresh();
    await qc.invalidateQueries({ queryKey: ["admin", "order-items"] });
  };

  const list = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">الطلبات</h1>

      <div className="flex flex-wrap gap-2">
        {(["all", ...statusOrder] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as OrderStatus | "all")}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              filter === s ? "gradient-gold text-primary-foreground" : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {s === "all" ? "الكل" : statusLabels[s as OrderStatus]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((o) => {
          const orderItems = items.filter((i) => i.order_id === o.id);
          return (
            <div key={o.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-extrabold">#{o.order_number}</span>
                <span className="text-sm">{o.customer_name}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">{o.phone}</span>
                <span className="text-xs text-muted-foreground">{o.city}</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor[o.status]}`}>
                  {statusLabels[o.status]}
                </span>
                <span className="ms-auto text-sm font-bold">
                  {formatMoney(Number(o.total), o.currency_label ?? label)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                >
                  {statusOrder.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
                <a
                  href={whatsappLink(o.phone, `مرحباً ${o.customer_name}، بخصوص طلبك رقم #${o.order_number}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                >
                  <MessageCircle className="h-4 w-4" /> واتساب
                </a>
                <button
                  onClick={() => setOpen(open === o.id ? null : o.id)}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                >
                  {open === o.id ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                </button>
                <button onClick={() => remove(o)} className="rounded-xl bg-destructive/10 p-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="ms-auto text-[11px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ar-EG")}
                </span>
              </div>

              {open === o.id && (
                <div className="mt-3 rounded-2xl bg-secondary/50 p-4 text-xs">
                  <p><span className="font-bold">العنوان:</span> {o.city}{o.district ? ` - ${o.district}` : ""} - {o.address}</p>
                  {o.notes && <p className="mt-1"><span className="font-bold">ملاحظات:</span> {o.notes}</p>}
                  <ul className="mt-3 divide-y divide-border">
                    {orderItems.map((i) => (
                      <li key={i.id} className="flex justify-between py-1">
                        <span>{i.product_name} × {i.quantity}</span>
                        <span className="font-bold">
                          {formatMoney(Number(i.price) * i.quantity, o.currency_label ?? label)}
                        </span>
                      </li>
                    ))}
                    {orderItems.length === 0 && <li className="py-1 text-muted-foreground">لا توجد أصناف مسجلة</li>}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            لا توجد طلبات في هذه الحالة
          </p>
        )}
      </div>
    </div>
  );
}
