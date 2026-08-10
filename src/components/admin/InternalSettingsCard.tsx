import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSettings } from "@/lib/admin";

/** Internal (non-store) controls: badge visibility and other private options. */
export function InternalSettingsCard() {
  const qc = useQueryClient();
  const { data: settings } = useAdminSettings();
  const [busy, setBusy] = useState(false);
  const hidden = settings?.hide_lovable_badge !== false;

  const toggle = async () => {
    if (!settings) return;
    setBusy(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ hide_lovable_badge: !hidden } as never)
      .eq("id", settings.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(!hidden ? "تم إخفاء الشارة" : "تم إظهار الشارة");
    await qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    await qc.invalidateQueries({ queryKey: ["settings"] });
  };

  return (
    <div className="mt-3 rounded-2xl border border-border bg-secondary/40 p-3">
      <p className="text-xs font-extrabold">الإعدادات الداخلية</p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold">زر Edit with Lovable</p>
          <p className="text-[10px] text-muted-foreground">{hidden ? "مخفي حالياً" : "ظاهر حالياً"}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={busy || !settings}
          aria-pressed={hidden}
          aria-label="تبديل إظهار زر Edit with Lovable"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            hidden ? "bg-primary" : "bg-muted-foreground/40"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${
              hidden ? "right-0.5" : "right-[22px]"
            }`}
          />
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        الشارة مخفية افتراضياً في الموقع المنشور.
      </p>
    </div>
  );
}