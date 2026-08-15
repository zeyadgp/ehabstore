import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/admin";
import { SmartImage } from "@/components/SmartImage";
import { useAllPaymentMethods, type PaymentMethod } from "@/lib/payments";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

function AdminPayments() {
  const qc = useQueryClient();
  const { data: methods = [], isLoading } = useAllPaymentMethods();
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["payment-methods"] });

  const patch = async (m: PaymentMethod, values: Partial<PaymentMethod>) => {
    setBusy(true);
    const { error } = await supabase.from("payment_methods").update(values as never).eq("id", m.id);
    setBusy(false);
    if (error) return toast.error(`فشل الحفظ: ${error.message}`);
    toast.success("تم الحفظ");
    await refresh();
  };

  const add = async () => {
    const name = prompt("اسم طريقة الدفع");
    if (!name?.trim()) return;
    const { error } = await supabase
      .from("payment_methods")
      .insert({ name: name.trim(), sort_order: methods.length } as never);
    if (error) return toast.error(error.message);
    toast.success("تمت الإضافة");
    await refresh();
  };

  const remove = async (m: PaymentMethod) => {
    if (!confirm(`حذف "${m.name}"؟`)) return;
    const { error } = await supabase.from("payment_methods").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    await refresh();
  };

  const uploadIcon = async (m: PaymentMethod, file: File) => {
    setBusy(true);
    try {
      const path = await uploadImage(file, "payments");
      await patch(m, { icon: path });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">طرق الدفع</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تحكّمي بطرق الدفع وأيقوناتها وأرقام الحسابات التي تظهر عند إتمام الطلب.
          </p>
        </div>
        <button
          onClick={add}
          className="flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> طريقة جديدة
        </button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}

      <div className="space-y-3">
        {methods.map((m) => (
          <div key={m.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              {m.icon && !/^\p{Extended_Pictographic}/u.test(m.icon) ? (
                <SmartImage
                  paths={[m.icon]}
                  fallback="/favicon.png"
                  alt={m.name}
                  className="h-10 w-10 rounded-xl object-contain"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg text-primary">
                  {m.icon || m.name.slice(0, 1)}
                </span>
              )}
              <input
                defaultValue={m.name}
                onBlur={(e) => e.target.value.trim() !== m.name && patch(m, { name: e.target.value.trim() })}
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none focus:border-primary"
              />
              <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-[11px] font-bold text-primary">
                <Upload className="h-3.5 w-3.5" /> أيقونة
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => e.target.files?.[0] && uploadIcon(m, e.target.files[0] as File)}
                />
              </label>
              <label className="flex items-center gap-2 text-[11px] font-bold">
                <input
                  type="checkbox"
                  checked={m.is_active}
                  onChange={(e) => patch(m, { is_active: e.target.checked })}
                />
                مفعّلة
              </label>
              <input
                type="number"
                defaultValue={m.sort_order}
                onBlur={(e) => Number(e.target.value) !== m.sort_order && patch(m, { sort_order: Number(e.target.value) })}
                className="w-16 rounded-xl border border-border bg-background px-2 py-2 text-center text-sm outline-none focus:border-primary"
                aria-label="الترتيب"
              />
              <button
                onClick={() => remove(m)}
                aria-label="حذف"
                className="rounded-lg bg-destructive/10 p-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold">رقم الحساب / المحفظة</span>
                <input
                  defaultValue={m.account_details ?? ""}
                  onBlur={(e) => e.target.value !== (m.account_details ?? "") && patch(m, { account_details: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold">تعليمات للعميل</span>
                <input
                  defaultValue={m.instructions ?? ""}
                  onBlur={(e) => e.target.value !== (m.instructions ?? "") && patch(m, { instructions: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold">أيقونة نصية (إيموجي) بديلة عن الصورة</span>
                <input
                  defaultValue={m.icon && /^\p{Extended_Pictographic}/u.test(m.icon) ? m.icon : ""}
                  placeholder="مثال: 💳"
                  onBlur={(e) => e.target.value && e.target.value !== m.icon && patch(m, { icon: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
