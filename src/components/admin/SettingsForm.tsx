import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSettings } from "@/lib/admin";
import type { StoreSettingsFull } from "@/lib/store";

export type SettingsField = {
  key: keyof StoreSettingsFull;
  label: string;
  type?: "text" | "textarea" | "ltr";
  hint?: string;
};

export function SettingsForm({ title, fields }: { title: string; fields: SettingsField[] }) {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useAdminSettings();
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    fields.forEach((f) => {
      const v = settings[f.key];
      next[f.key as string] = v == null ? "" : String(v);
    });
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    const patch: Record<string, string | null> = {};
    fields.forEach((f) => {
      const value = (form[f.key as string] ?? "").trim();
      patch[f.key as string] = value === "" ? null : value;
    });
    const { error } = await supabase.from("store_settings").update(patch as never).eq("id", settings.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم حفظ الإعدادات");
    await qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    await qc.invalidateQueries({ queryKey: ["settings"] });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">جاري التحميل…</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key as string} className={f.type === "textarea" ? "sm:col-span-2 block" : "block"}>
            <span className="text-xs font-bold">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                rows={4}
                value={form[f.key as string] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key as string]: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : (
              <input
                dir={f.type === "ltr" ? "ltr" : undefined}
                value={form[f.key as string] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key as string]: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            )}
            {f.hint && <span className="mt-1 block text-[11px] text-muted-foreground">{f.hint}</span>}
          </label>
        ))}
        <div className="sm:col-span-2">
          <button
            onClick={save}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
}
