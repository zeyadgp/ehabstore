import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adjustPoints } from "@/lib/loyalty.functions";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { useLoyaltyRewards, useLoyaltySettings, type LoyaltyReward } from "@/lib/loyalty";

export const Route = createFileRoute("/admin/loyalty")({ component: AdminLoyalty });

type Account = {
  id: string;
  phone: string;
  customer_name: string | null;
  points: number;
  pending_points: number;
  total_spent: number;
};

function useAccounts() {
  return useQuery({
    queryKey: ["admin", "loyalty-accounts"],
    queryFn: async (): Promise<Account[]> => {
      const { data } = await supabase
        .from("loyalty_accounts")
        .select("id, phone, customer_name, points, pending_points, total_spent")
        .order("points", { ascending: false })
        .limit(200);
      return (data as Account[] | null) ?? [];
    },
  });
}

function AdminLoyalty() {
  const qc = useQueryClient();
  const { data: settings } = useLoyaltySettings();
  const { data: rewards = [] } = useLoyaltyRewards();
  const { data: accounts = [] } = useAccounts();
  const adjust = useServerFn(adjustPoints);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState({ name: "", points_required: 100, discount_type: "amount", discount_value: 1000 });

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["loyalty"] });
    await qc.invalidateQueries({ queryKey: ["admin", "loyalty-accounts"] });
  };

  const saveSettings = async (patch: {
    amount_per_point?: number;
    min_redeem_points?: number;
    point_value?: number;
    coupon_expiry_days?: number;
    is_active?: boolean;
  }) => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("loyalty_settings").update(patch).eq("id", settings.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم الحفظ");
    await refresh();
  };

  const addReward = async () => {
    if (!reward.name.trim()) {
      toast.error("اسم المكافأة مطلوب");
      return;
    }
    const { error } = await supabase.from("loyalty_rewards").insert({
      name: reward.name.trim(),
      points_required: Number(reward.points_required),
      discount_type: reward.discount_type,
      discount_value: Number(reward.discount_value),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setReward({ name: "", points_required: 100, discount_type: "amount", discount_value: 1000 });
    toast.success("تمت إضافة المكافأة");
    await refresh();
  };

  const removeReward = async (r: LoyaltyReward) => {
    if (!confirm(`حذف المكافأة «${r.name}»؟`)) return;
    const { error } = await supabase.from("loyalty_rewards").delete().eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  };

  const changePoints = async (a: Account) => {
    const raw = prompt(`تعديل نقاط ${a.customer_name ?? a.phone} (استخدم رقم سالب للخصم):`, "10");
    if (!raw) return;
    const value = Number(raw);
    if (!Number.isFinite(value) || value === 0) return;
    try {
      await adjust({ data: { phone: a.phone, points: Math.trunc(value) } });
      toast.success("تم تعديل النقاط");
      await refresh();
    } catch {
      toast.error("تعذّر التعديل");
    }
  };

  const input = adminInput;

  const filtered = accounts.filter((a) => {
    const q = search.trim();
    if (!q) return true;
    return (a.customer_name ?? "").includes(q) || a.phone.includes(q);
  });
  const totalPoints = accounts.reduce((s, a) => s + Number(a.points), 0);
  const totalSpent = accounts.reduce((s, a) => s + Number(a.total_spent), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Gift}
        title="برنامج الولاء"
        subtitle="اضبطي قواعد النقاط والمكافآت وتابعي أرصدة العملاء"
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard label="عملاء البرنامج" value={accounts.length} tone="primary" />
        <StatCard label="إجمالي النقاط" value={totalPoints.toLocaleString("ar")} />
        <StatCard label="مشتريات الأعضاء" value={Math.round(totalSpent).toLocaleString("ar")} />
        <StatCard label="المكافآت المتاحة" value={rewards.length} tone="warning" />
      </div>

      <CollapsibleCard title="قواعد كسب النقاط" defaultOpen>
        {settings && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-bold">
              مبلغ النقطة الواحدة ({settings.base_currency})
              <input
                type="number"
                defaultValue={settings.amount_per_point}
                onBlur={(e) => void saveSettings({ amount_per_point: Number(e.target.value) || 1 })}
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="text-xs font-bold">
              الحد الأدنى للاستبدال
              <input
                type="number"
                defaultValue={settings.min_redeem_points}
                onBlur={(e) => void saveSettings({ min_redeem_points: Number(e.target.value) || 1 })}
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="text-xs font-bold">
              قيمة النقطة ({settings.base_currency})
              <input
                type="number"
                defaultValue={settings.point_value}
                onBlur={(e) => void saveSettings({ point_value: Number(e.target.value) || 0 })}
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="text-xs font-bold">
              صلاحية الكوبون (أيام)
              <input
                type="number"
                defaultValue={settings.coupon_expiry_days}
                onBlur={(e) => void saveSettings({ coupon_expiry_days: Number(e.target.value) || 30 })}
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                defaultChecked={settings.is_active}
                onChange={(e) => void saveSettings({ is_active: e.target.checked })}
              />
              تفعيل برنامج الولاء
            </label>
          </div>
        )}
        {saving && <p className="mt-2 text-xs text-muted-foreground">جاري الحفظ…</p>}
      </CollapsibleCard>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <h2 className="text-sm font-bold">المكافآت ({rewards.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rewards.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
              <span className="min-w-0 flex-1">
                <span className="font-bold">{r.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {r.points_required} نقطة ·{" "}
                  {r.discount_type === "percent" ? `${r.discount_value}%` : `${r.discount_value} ${settings?.base_currency ?? ""}`}
                </span>
              </span>
              <button
                onClick={() => void removeReward(r)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {rewards.length === 0 && (
            <li>
              <EmptyState icon={Gift} title="لا توجد مكافآت" hint="أضيفي أول مكافأة يستبدل بها العملاء نقاطهم." />
            </li>
          )}
        </ul>

        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          <input
            value={reward.name}
            onChange={(e) => setReward((r) => ({ ...r, name: e.target.value }))}
            placeholder="اسم المكافأة"
            className={`sm:col-span-2 ${input}`}
          />
          <input
            type="number"
            value={reward.points_required}
            onChange={(e) => setReward((r) => ({ ...r, points_required: Number(e.target.value) }))}
            placeholder="النقاط"
            className={input}
          />
          <select
            value={reward.discount_type}
            onChange={(e) => setReward((r) => ({ ...r, discount_type: e.target.value }))}
            className={input}
          >
            <option value="amount">خصم مبلغ</option>
            <option value="percent">خصم نسبة %</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              value={reward.discount_value}
              onChange={(e) => setReward((r) => ({ ...r, discount_value: Number(e.target.value) }))}
              className={input}
            />
            <button
              onClick={() => void addReward()}
              className="flex min-h-11 w-12 items-center justify-center rounded-xl gradient-gold text-primary-foreground"
              aria-label="إضافة مكافأة"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">أرصدة العملاء ({accounts.length})</h2>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الجوال"
              className={`${input} ps-9`}
            />
          </div>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {filtered.map((a) => (
            <li key={a.id} className="rounded-2xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{a.customer_name ?? "عميل"}</p>
                  <p dir="ltr" className="text-xs text-muted-foreground">{a.phone}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-extrabold text-primary">{a.points} نقطة</p>
                  {a.pending_points > 0 && (
                    <p className="text-[11px] text-muted-foreground">{a.pending_points} معلّقة</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  إجمالي المشتريات: {Math.round(Number(a.total_spent)).toLocaleString("ar")}
                </span>
                <button onClick={() => void changePoints(a)} className={`${adminBtn} border border-border`}>
                  تعديل النقاط
                </button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li>
              <EmptyState icon={Gift} title="لا توجد حسابات نقاط" hint="تُنشأ الحسابات تلقائياً مع أول طلب للعميل." />
            </li>
          )}
        </ul>
      </section>

      <CouponsManager />
    </div>
  );
}
