import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatMoney, useSettings } from "@/lib/store";
import { buildWhatsappMessage, whatsappLink } from "@/lib/whatsapp";

const title = "إتمام الطلب | إيهاب ستور للعناية والتجميل";
const description = "أدخلي بياناتكِ لإتمام الطلب وإرساله مباشرة عبر واتساب.";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(80),
  phone: z.string().trim().min(7, "رقم هاتف غير صحيح").max(20),
  city: z.string().trim().min(2, "المدينة مطلوبة").max(60),
  address: z.string().trim().min(5, "العنوان مطلوب").max(200),
  notes: z.string().trim().max(400).optional(),
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const currency = settings?.currency_label ?? "ر.س";

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">لا توجد منتجات في السلة</h1>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl gradient-gold px-7 py-3 text-sm font-bold text-primary-foreground"
        >
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[String(i.path[0])] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: parsed.data.name,
          phone: parsed.data.phone,
          city: parsed.data.city,
          address: parsed.data.address,
          notes: parsed.data.notes ?? null,
          total,
          currency: settings?.currency ?? "SAR",
        })
        .select("id, order_number")
        .single();
      if (error) throw error;

      const rows = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(rows);
      if (itemsError) throw itemsError;

      const message = buildWhatsappMessage({
        storeName: settings?.store_name ?? "إيهاب ستور للعناية والتجميل",
        orderNumber: (order as { order_number?: number }).order_number ?? null,
        info: { ...parsed.data, notes: parsed.data.notes ?? "" },
        items,
        total,
        currencyLabel: currency,
      });
      const link = whatsappLink(settings?.whatsapp_number ?? "+967780187409", message);
      clear();
      toast.success("تم تسجيل طلبكِ، سيتم تحويلكِ إلى واتساب");
      window.open(link, "_blank", "noopener");
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error("تعذّر إرسال الطلب، حاولي مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    name: keyof typeof form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-bold">{label}</label>
      <input
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        {...props}
      />
      {errors[name] && <p className="mt-1 text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-extrabold md:text-3xl">إتمام الطلب</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        بعد التأكيد سيتم إرسال تفاصيل طلبكِ مباشرة إلى واتساب المتجر.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          {field("name", "الاسم الكامل", { placeholder: "مثال: سارة أحمد", maxLength: 80 })}
          {field("phone", "رقم الجوال", { placeholder: "9665xxxxxxx", dir: "ltr", maxLength: 20 })}
          {field("city", "المدينة", { placeholder: "الرياض", maxLength: 60 })}
          {field("address", "العنوان بالتفصيل", { placeholder: "الحي، الشارع، رقم المبنى", maxLength: 200 })}
          <div>
            <label className="mb-1.5 block text-sm font-bold">ملاحظات (اختياري)</label>
            <textarea
              value={form.notes}
              maxLength={400}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-base font-bold">ملخص الطلب</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">
                  {i.name} × {i.quantity}
                </span>
                <span className="shrink-0">{formatMoney(i.price * i.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3 text-base font-extrabold">
            <span>الإجمالي</span>
            <span className="text-primary">{formatMoney(total, currency)}</span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {saving ? "جاري الإرسال..." : "تأكيد الطلب عبر واتساب"}
          </button>
        </aside>
      </form>
    </div>
  );
}