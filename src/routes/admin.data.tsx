import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/data")({ component: AdminData });

/** Tables that can be exported / restored from the dashboard. */
const TABLES = [
  "categories",
  "products",
  "product_prices",
  "currencies",
  "banners",
  "payment_methods",
  "themes",
  "testimonials",
  "loyalty_rewards",
  "loyalty_settings",
  "store_settings",
] as const;

type TableName = (typeof TABLES)[number];
type Backup = Partial<Record<TableName, Record<string, unknown>[]>>;

function AdminData() {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const exportAll = async () => {
    setBusy(true);
    setLog([]);
    const backup: Backup = {};
    const lines: string[] = [];
    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        lines.push(`${table}: تعذّر التصدير (${error.message})`);
        continue;
      }
      backup[table] = (data as Record<string, unknown>[]) ?? [];
      lines.push(`${table}: ${backup[table]?.length ?? 0} سجل`);
    }
    setLog(lines);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    toast.success("تم تصدير قاعدة البيانات");
  };

  const importAll = async (file: File) => {
    setBusy(true);
    setLog([]);
    const lines: string[] = [];
    try {
      const backup = JSON.parse(await file.text()) as Backup;
      for (const table of TABLES) {
        const rows = backup[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        const { error } = await supabase.from(table).upsert(rows as never, { onConflict: "id" });
        lines.push(error ? `${table}: فشل (${error.message})` : `${table}: تم استيراد ${rows.length} سجل`);
      }
      setLog(lines);
      toast.success("انتهى الاستيراد");
    } catch (e) {
      toast.error(`ملف غير صالح: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">استيراد وتصدير قاعدة البيانات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          صدّري نسخة احتياطية من بيانات المتجر بصيغة JSON، أو استوردي نسخة سابقة لاستعادة البيانات.
          الاستيراد يحدّث السجلات المطابقة ويضيف الجديدة (لا يحذف شيئاً).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportAll}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> تصدير نسخة احتياطية
        </button>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-primary">
          <Upload className="h-4 w-4" /> استيراد ملف JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && importAll(e.target.files[0] as File)}
          />
        </label>
      </div>

      {busy && <p className="text-sm text-muted-foreground">جاري التنفيذ…</p>}

      {log.length > 0 && (
        <ul className="space-y-1 rounded-3xl border border-border bg-card p-4 text-xs shadow-soft">
          {log.map((l) => (
            <li key={l} dir="auto">{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
