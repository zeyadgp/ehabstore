import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, MessageCircle, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { syncOrderPoints } from "@/lib/loyalty.functions";
import {
  paymentStatusLabels,
  statusColor,
  statusLabels,
  statusOrder,
  useOrderItems,
  useOrders,
  useWhatsappMessages,
  type Order,
  type OrderStatus,
  useAdminCurrency,
} from "@/lib/admin";
import { formatMoney, useSettings } from "@/lib/store";
import { whatsappLink } from "@/lib/whatsapp";
import {
  fillTemplate,
  loadWaTemplates,
  saveWaTemplates,
  waTemplateLabels,
  type WaTemplateKey,
} from "@/lib/wa-templates";

export const Route = createFileRoute("/admin/orders")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s["order"] === "string" ? (s["order"] as string) : undefined,
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [] } = useOrders();
  const { data: items = [] } = useOrderItems();
  const { data: messages = [] } = useWhatsappMessages();
  const { data: settings } = useSettings();
  const { label } = useAdminCurrency();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [templates, setTemplates] = useState(() => loadWaTemplates());
  const [editTemplates, setEditTemplates] = useState(false);

  const syncPoints = useServerFn(syncOrderPoints);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "orders"] });

  const setStatus = async (o: Order, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث حالة الطلب");
    if (["completed", "delivered", "cancelled", "returned"].includes(status)) {
      const mapped = status === "delivered" ? "completed" : status === "returned" ? "cancelled" : status;
      try {
        const res = await syncPoints({ data: { orderId: o.id, status: mapped as "completed" | "cancelled" } });
        if (res.ok && res.points > 0) toast.success(`تم اعتماد ${res.points} نقطة ولاء للعميل`);
        if (res.ok && res.points < 0) toast.info("تم إلغاء نقاط هذا الطلب");
        await qc.invalidateQueries({ queryKey: ["admin", "loyalty-accounts"] });
        await qc.invalidateQueries({ queryKey: ["admin", "invoices"] });
      } catch {
        /* نظام الولاء اختياري */
      }
    }
    await refresh();
  };

  const setPayment = async (o: Order, payment_status: string) => {
    const { error } = await supabase.from("orders").update({ payment_status }).eq("id", o.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("invoices").update({ payment_status }).eq("order_id", o.id);
    toast.success("تم تحديث حالة الدفع");
    await refresh();
    await qc.invalidateQueries({ queryKey: ["admin", "invoices"] });
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

  const sendTemplate = async (o: Order, key: WaTemplateKey) => {
    const currency = o.currency_label ?? label;
    const body = fillTemplate(templates[key], {
      name: o.customer_name,
      order: o.order_number,
      total: formatMoney(Number(o.total), currency),
      city: o.city,
      store: settings?.store_name ?? "متجرنا",
      delivery: formatMoney(Number(o.delivery_fee ?? 0), currency),
    });
    window.open(whatsappLink(o.phone, body), "_blank", "noopener");
    await supabase.from("whatsapp_messages").insert({ order_id: o.id, phone: o.phone, template: key, body });
    await supabase.from("orders").update({ last_contact_at: new Date().toISOString() }).eq("id", o.id);
    await refresh();
    await qc.invalidateQueries({ queryKey: ["admin", "wa-messages"] });
  };

  const list = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => {
      if (!q.trim()) return true;
      const needle = q.trim().toLowerCase();
      const orderItems = items.filter((i) => i.order_id === o.id);
      return (
        String(o.order_number).includes(needle) ||
        o.customer_name.toLowerCase().includes(needle) ||
        o.phone.includes(needle) ||
        o.city.toLowerCase().includes(needle) ||
        orderItems.some((i) => i.product_name.toLowerCase().includes(needle))
      );
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">الطلبات</h1>
        <button
          onClick={() => setEditTemplates((v) => !v)}
          className="ms-auto rounded-xl border border-border px-3 py-2 text-xs font-bold"
        >
          {editTemplates ? "إغلاق قوالب الواتساب" : "قوالب الواتساب"}
        </button>
      </div>

      {editTemplates && (
        <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2">
          {(Object.keys(waTemplateLabels) as WaTemplateKey[]).map((k) => (
            <label key={k} className="block">
              <span className="text-xs font-bold">{waTemplateLabels[k]}</span>
              <textarea
                rows={3}
                value={templates[k]}
                onChange={(e) => setTemplates({ ...templates, [k]: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <p className="text-[11px] text-muted-foreground">
              المتغيرات المتاحة: {"{name} {order} {total} {city} {store} {delivery}"}
            </p>
            <button
              onClick={() => { saveWaTemplates(templates); toast.success("تم حفظ القوالب"); }}
              className="mt-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              حفظ القوالب
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث برقم الطلب أو الاسم أو الواتساب أو المنتج"
          className="w-full rounded-xl border border-border bg-background py-2 pe-3 ps-9 text-sm"
        />
      </div>

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
          const logs = messages.filter((m) => m.order_id === o.id);
          const currency = o.currency_label ?? label;
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
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold">
                  {paymentStatusLabels[o.payment_status ?? "unpaid"] ?? o.payment_status}
                </span>
                <span className="ms-auto text-sm font-bold">{formatMoney(Number(o.total), currency)}</span>
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
                <select
                  value={o.payment_status ?? "unpaid"}
                  onChange={(e) => setPayment(o, e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                >
                  {Object.entries(paymentStatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
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

              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(waTemplateLabels) as WaTemplateKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => void sendTemplate(o, k)}
                    className="rounded-full border border-border px-3 py-1 text-[11px] font-bold text-muted-foreground hover:bg-secondary"
                  >
                    {waTemplateLabels[k]}
                  </button>
                ))}
              </div>

              {open === o.id && (
                <div className="mt-3 rounded-2xl bg-secondary/50 p-4 text-xs">
                  <p><span className="font-bold">العنوان:</span> {o.city}{o.district ? ` - ${o.district}` : ""} - {o.address}</p>
                  {o.notes && <p className="mt-1"><span className="font-bold">ملاحظات:</span> {o.notes}</p>}
                  <p className="mt-1">
                    <span className="font-bold">التوصيل:</span> {formatMoney(Number(o.delivery_fee ?? 0), currency)}
                    {o.payment_method ? ` — طريقة الدفع: ${o.payment_method}` : ""}
                  </p>

                  {o.receipt_url && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <a
                        href={o.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-border bg-card px-3 py-1.5 font-bold"
                      >
                        عرض سند الدفع
                      </a>
                      <button
                        onClick={() => setPayment(o, "paid")}
                        className="flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 font-bold text-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" /> اعتماد الدفع
                      </button>
                      <button
                        onClick={() => setPayment(o, "failed")}
                        className="flex items-center gap-1 rounded-xl bg-rose-100 px-3 py-1.5 font-bold text-rose-700"
                      >
                        <X className="h-3.5 w-3.5" /> رفض
                      </button>
                    </div>
                  )}

                  <ul className="mt-3 divide-y divide-border">
                    {orderItems.map((i) => (
                      <li key={i.id} className="flex justify-between py-1">
                        <span>{i.product_name} × {i.quantity}</span>
                        <span className="font-bold">{formatMoney(Number(i.price) * i.quantity, currency)}</span>
                      </li>
                    ))}
                    {orderItems.length === 0 && <li className="py-1 text-muted-foreground">لا توجد أصناف مسجلة</li>}
                  </ul>

                  {logs.length > 0 && (
                    <div className="mt-3">
                      <p className="font-bold">سجل الرسائل</p>
                      <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                        {logs.slice(0, 6).map((m) => (
                          <li key={m.id}>
                            {new Date(m.created_at).toLocaleString("ar-EG")} — {waTemplateLabels[(m.template ?? "confirm") as WaTemplateKey] ?? m.template}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            لا توجد طلبات مطابقة
          </p>
        )}
      </div>
    </div>
  );
}
