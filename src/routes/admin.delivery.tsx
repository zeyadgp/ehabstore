import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryZones, type DeliveryZone } from "@/lib/delivery";
import { useAdminSettings } from "@/lib/admin";
import { YEMEN_GOVERNORATES } from "@/lib/yemen";

export const Route = createFileRoute("/admin/delivery")({ component: AdminDelivery });

function AdminDelivery() {
  const qc = useQueryClient();
  const { data: zones = [] } = useDeliveryZones();
  const { data: settings } = useAdminSettings();
  const [gov, setGov] = useState<string>(YEMEN_GOVERNORATES[0] ?? "");
  const [fee, setFee] = useState("2000");

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["delivery-zones"] });
    await qc.invalidateQueries({ queryKey: ["admin", "settings"] });
  };

  const add = async () => {
    const { error } = await supabase
      .from("delivery_zones")
      .insert({ governorate: gov, fee: Number(fee) || 0, sort_order: zones.length });
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة المنطقة");
    await refresh();
  };

  const update = async (z: DeliveryZone, patch: Partial<DeliveryZone>) => {
    const { error } = await supabase.from("delivery_zones").update(patch as never).eq("id", z.id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  };

  const remove = async (z: DeliveryZone) => {
    if (!confirm(`حذف منطقة ${z.governorate}؟`)) return;
    await supabase.from("delivery_zones").delete().eq("id", z.id);
    await refresh();
  };

  const saveGeneral = async (patch: Record<string, unknown>) => {
    if (!settings?.id) { toast.error("لا يوجد سجل إعدادات بعد"); return; }
    const { error } = await supabase.from("store_settings").update(patch as never).eq("id", settings.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    await refresh();
  };

  const s = settings as unknown as {
    delivery_enabled?: boolean;
    delivery_default_fee?: number;
    free_delivery_until?: string | null;
  } | null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">إعدادات التوصيل</h1>

      <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-bold">تفعيل رسوم التوصيل</span>
          <select
            defaultValue={s?.delivery_enabled === false ? "off" : "on"}
            onChange={(e) => void saveGeneral({ delivery_enabled: e.target.value === "on" })}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="on">مفعّل</option>
            <option value="off">موقوف (توصيل مجاني)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold">الرسوم الافتراضية (ريال يمني)</span>
          <input
            type="number"
            defaultValue={String(s?.delivery_default_fee ?? 2000)}
            onBlur={(e) => void saveGeneral({ delivery_default_fee: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold">توصيل مجاني حتى تاريخ</span>
          <input
            type="date"
            defaultValue={s?.free_delivery_until ? s.free_delivery_until.slice(0, 10) : ""}
            onChange={(e) =>
              void saveGeneral({ free_delivery_until: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-bold">مناطق التوصيل</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <select
            value={gov}
            onChange={(e) => setGov(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {YEMEN_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button onClick={add} className="flex items-center gap-1 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground">
            <Plus className="h-4 w-4" /> إضافة
          </button>
        </div>

        <ul className="mt-4 divide-y divide-border text-sm">
          {zones.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-28 font-bold">{z.governorate}</span>
              <input
                type="number"
                defaultValue={String(z.fee)}
                onBlur={(e) => void update(z, { fee: Number(e.target.value) || 0 })}
                className="w-28 rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
              />
              <button
                onClick={() => void update(z, { is_active: !z.is_active })}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${z.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
              >
                {z.is_active ? "مفعّلة" : "موقوفة"}
              </button>
              <button onClick={() => void remove(z)} className="ms-auto rounded-xl bg-destructive/10 p-2 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {zones.length === 0 && (
            <li className="py-4 text-xs text-muted-foreground">لا توجد مناطق — أضيفي صنعاء 1000 وباقي المحافظات 2000</li>
          )}
        </ul>
        <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Save className="h-3 w-3" /> التعديلات تُحفظ تلقائياً عند الخروج من الحقل.
        </p>
      </div>
    </div>
  );
}
