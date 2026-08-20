import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import { paymentStatusLabels, useInvoices, useOrderItems, useOrders } from "@/lib/admin";
import { formatMoney } from "@/lib/store";
import { useSettings } from "@/lib/store";
import { whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/invoices")({ component: AdminInvoices });

function AdminInvoices() {
  const { data: invoices = [] } = useInvoices();
  const { data: orders = [] } = useOrders();
  const { data: items = [] } = useOrderItems();
  const { data: settings } = useSettings();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);

  const list = invoices
    .filter((i) => (status === "all" ? true : i.payment_status === status))
    .filter((i) =>
      q
        ? [String(i.invoice_number), i.customer_name, i.phone].some((v) =>
            v.toLowerCase().includes(q.toLowerCase()),
          )
        : true,
    );

  const print = () => window.print();

  const share = (invoiceId: string) => {
    const inv = invoices.find((x) => x.id === invoiceId);
    if (!inv) return;
    const order = orders.find((o) => o.id === inv.order_id);
    const lines = items
      .filter((it) => it.order_id === inv.order_id)
      .map((it) => `- ${it.product_name} × ${it.quantity} = ${formatMoney(Number(it.price) * it.quantity, inv.currency_label)}`);
    const body = [
      `فاتورة رقم #${inv.invoice_number} — ${settings?.store_name ?? "متجرنا"}`,
      `العميل: ${inv.customer_name}`,
      order ? `الطلب: #${order.order_number}` : null,
      "",
      ...lines,
      "",
      `المجموع: ${formatMoney(Number(inv.subtotal), inv.currency_label)}`,
      Number(inv.discount) > 0 ? `الخصم: ${formatMoney(Number(inv.discount), inv.currency_label)}` : null,
      `التوصيل: ${formatMoney(Number(inv.delivery_fee), inv.currency_label)}`,
      `الإجمالي: ${formatMoney(Number(inv.total), inv.currency_label)}`,
      inv.payment_method ? `طريقة الدفع: ${inv.payment_method}` : null,
      inv.points_awarded > 0 ? `نقاط الولاء: ${inv.points_awarded}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(whatsappLink(inv.phone, body), "_blank", "noopener");
    toast.success("تم فتح واتساب لمشاركة الفاتورة");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">الفواتير</h1>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث برقم الفاتورة أو العميل أو الواتساب"
            className="w-full rounded-xl border border-border bg-background py-2 pe-3 ps-9 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
        >
          <option value="all">كل الحالات</option>
          {Object.entries(paymentStatusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {list.map((inv) => {
          const order = orders.find((o) => o.id === inv.order_id);
          const invItems = items.filter((it) => it.order_id === inv.order_id);
          return (
            <div key={inv.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-extrabold">فاتورة #{inv.invoice_number}</span>
                <span className="text-sm">{inv.customer_name}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">{inv.phone}</span>
                {order && <span className="text-xs text-muted-foreground">طلب #{order.order_number}</span>}
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold">
                  {paymentStatusLabels[inv.payment_status] ?? inv.payment_status}
                </span>
                <span className="ms-auto text-sm font-bold">
                  {formatMoney(Number(inv.total), inv.currency_label)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                <button
                  onClick={() => setOpen(open === inv.id ? null : inv.id)}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
                >
                  {open === inv.id ? "إخفاء" : "عرض الفاتورة"}
                </button>
                <button onClick={print} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold">
                  <Printer className="h-4 w-4" /> طباعة
                </button>
                <button
                  onClick={() => share(inv.id)}
                  className="flex items-center gap-1 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                >
                  <Share2 className="h-4 w-4" /> مشاركة
                </button>
                <span className="ms-auto text-[11px] text-muted-foreground">
                  {new Date(inv.issued_at).toLocaleString("ar-EG")}
                </span>
              </div>

              {open === inv.id && (
                <div className="mt-3 rounded-2xl bg-secondary/50 p-4 text-xs">
                  <ul className="divide-y divide-border">
                    {invItems.map((it) => (
                      <li key={it.id} className="flex justify-between py-1">
                        <span>{it.product_name} × {it.quantity}</span>
                        <span className="font-bold">{formatMoney(Number(it.price) * it.quantity, inv.currency_label)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 space-y-1">
                    <Row k="المجموع" v={formatMoney(Number(inv.subtotal), inv.currency_label)} />
                    {Number(inv.discount) > 0 && (
                      <Row k="الخصم" v={formatMoney(Number(inv.discount), inv.currency_label)} />
                    )}
                    <Row k="التوصيل" v={formatMoney(Number(inv.delivery_fee), inv.currency_label)} />
                    <Row k="الإجمالي" v={formatMoney(Number(inv.total), inv.currency_label)} />
                    {inv.payment_method && <Row k="طريقة الدفع" v={inv.payment_method} />}
                    <Row k="نقاط الولاء" v={`${inv.points_awarded} نقطة`} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            لا توجد فواتير مطابقة
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-bold">{v}</span>
    </p>
  );
}
