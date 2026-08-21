import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "كوبونات الخصم | لوحة التحكم" }, { name: "robots", content: "noindex" }] }),
  component: CouponsAdmin,
});

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  commission_percent: number;
};

type Redemption = {
  id: string;
  coupon_id: string;
  code: string;
  order_number: number | null;
  customer_phone: string | null;
  customer_name: string | null;
  discount_amount: number;
  order_total: number;
  created_at: string;
};

const empty = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  min_order: 0,
  max_uses: "" as number | "",
  expires_at: "",
  owner_name: "",
  owner_phone: "",
  commission_percent: 0,
};

function randomCode(seed: string) {
  const base = seed.trim() ? seed.trim().replace(/\s+/g, "").slice(0, 6).toUpperCase() : "EH";
  return `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function CouponsAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin", "discount-coupons"],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Coupon[]) ?? [];
    },
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ["admin", "coupon-redemptions"],
    queryFn: async (): Promise<Redemption[]> => {
      const { data, error } = await supabase
        .from("coupon_redemptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as unknown as Redemption[]) ?? [];
    },
  });

  const stats = useMemo(() => {
    const map: Record<string, { orders: number; sales: number; discount: number; customers: Set<string> }> = {};
    redemptions.forEach((r) => {
      const s = (map[r.coupon_id] ??= { orders: 0, sales: 0, discount: 0, customers: new Set() });
      s.orders += 1;
      s.sales += Number(r.order_total);
      s.discount += Number(r.discount_amount);
      if (r.customer_phone) s.customers.add(r.customer_phone);
    });
    return map;
  }, [redemptions]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "discount-coupons"] });
    await qc.invalidateQueries({ queryKey: ["admin", "coupon-redemptions"] });
  };

  const save = async () => {
    const code = (form.code || randomCode(form.owner_name)).trim().toUpperCase();
    const payload = {
      code,
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      min_order: Number(form.min_order) || 0,
      max_uses: form.max_uses === "" ? null : Number(form.max_uses),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      owner_name: form.owner_name || null,
      owner_phone: form.owner_phone || null,
      commission_percent: Number(form.commission_percent) || 0,
    };
    const res = editing
      ? await supabase.from("discount_coupons").update(payload as never).eq("id", editing)
      : await supabase.from("discount_coupons").insert(payload as never);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(editing ? "تم تحديث الكوبون" : "تم إنشاء الكوبون");
    setForm({ ...empty });
    setEditing(null);
    await refresh();
  };

  const toggle = async (c: Coupon) => {
    const { error } = await supabase
      .from("discount_coupons")
      .update({ is_active: !c.is_active } as never)
      .eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`حذف الكوبون ${c.code}؟`)) return;
    const { error } = await supabase.from("discount_coupons").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    await refresh();
  };

  const edit = (c: Coupon) => {
    setEditing(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      min_order: Number(c.min_order),
      max_uses: c.max_uses ?? "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      owner_name: c.owner_name ?? "",
      owner_phone: c.owner_phone ?? "",
      commission_percent: Number(c.commission_percent),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary";

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-extrabold">كوبونات الخصم وأكواد الإحالة</h1>
      </header>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-bold">{editing ? "تعديل كوبون" : "إنشاء كوبون جديد"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-[11px] font-bold">
            الكود (اتركيه فارغاً للتوليد التلقائي)
            <input dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={input} />
          </label>
          <label className="text-[11px] font-bold">
            نوع الخصم
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className={input}>
              <option value="percent">نسبة %</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
          </label>
          <label className="text-[11px] font-bold">
            قيمة الخصم
            <input type="number" min={0} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className={input} />
          </label>
          <label className="text-[11px] font-bold">
            أقل قيمة للطلب
            <input type="number" min={0} value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} className={input} />
          </label>
          <label className="text-[11px] font-bold">
            عدد مرات الاستخدام (فارغ = بلا حد)
            <input type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value === "" ? "" : Number(e.target.value) })} className={input} />
          </label>
          <label className="text-[11px] font-bold">
            تاريخ الانتهاء
            <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={input} />
          </label>
          <label className="text-[11px] font-bold">
            صاحب الكود (إحالة)
            <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className={input} />
          </label>
          <label className="text-[11px] font-bold">
            رقم صاحب الكود
            <input dir="ltr" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} className={input} />
          </label>
          <label className="text-[11px] font-bold">
            نسبة عمولة صاحب الكود %
            <input type="number" min={0} value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })} className={input} />
          </label>
          <label className="text-[11px] font-bold sm:col-span-2 lg:col-span-3">
            الوصف
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => void save()} className="flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> {editing ? "حفظ التعديل" : "إنشاء الكوبون"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ ...empty }); }} className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold">
              إلغاء
            </button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-bold">الكوبونات وتقارير الاستخدام ({coupons.length})</h2>
        <ul className="mt-3 space-y-2">
          {coupons.map((c) => {
            const s = stats[c.id];
            return (
              <li key={c.id} className="rounded-2xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="rounded-lg bg-secondary px-2 py-1 text-xs font-extrabold">{c.code}</span>
                  <span className="text-xs">
                    خصم {Number(c.discount_value)}{c.discount_type === "percent" ? "%" : ""}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.is_active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {c.is_active ? "فعّال" : "معطّل"}
                  </span>
                  {c.owner_name && (
                    <span className="text-[11px] text-muted-foreground">
                      صاحب الكود: {c.owner_name} <span dir="ltr">{c.owner_phone ?? ""}</span>
                    </span>
                  )}
                  {c.expires_at && (
                    <span className="text-[11px] text-muted-foreground">ينتهي {new Date(c.expires_at).toLocaleDateString("ar")}</span>
                  )}
                  <div className="ms-auto flex items-center gap-1">
                    <button onClick={() => { void navigator.clipboard.writeText(c.code); toast.success("تم نسخ الكود"); }} className="rounded-lg bg-secondary p-2" title="نسخ">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button onClick={() => edit(c)} className="rounded-lg bg-secondary px-3 py-2 text-[11px] font-bold">تعديل</button>
                    <button onClick={() => void toggle(c)} className="rounded-lg bg-secondary px-3 py-2 text-[11px] font-bold">
                      {c.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                    <button onClick={() => void remove(c)} className="rounded-lg bg-destructive/10 p-2 text-destructive" title="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:grid-cols-5">
                  <span>الاستخدامات: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</span>
                  <span>العملاء: {s?.customers.size ?? 0}</span>
                  <span>الطلبات: {s?.orders ?? 0}</span>
                  <span>المبيعات: {Math.round(s?.sales ?? 0).toLocaleString("ar")}</span>
                  <span>إجمالي الخصم: {Math.round(s?.discount ?? 0).toLocaleString("ar")}</span>
                </div>
              </li>
            );
          })}
          {coupons.length === 0 && <li className="py-4 text-center text-xs text-muted-foreground">لا توجد كوبونات بعد</li>}
        </ul>
      </section>
    </div>
  );
}
