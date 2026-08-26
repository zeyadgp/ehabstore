import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "@/lib/store";

export const Route = createFileRoute("/admin/data")({ component: AdminData });

/** Tables exported / restored from the dashboard (order matters for foreign keys). */
const TABLES = [
  "store_settings",
  "currencies",
  "themes",
  "categories",
  "products",
  "product_categories",
  "product_prices",
  "product_reviews",
  "banners",
  "payment_methods",
  "delivery_zones",
  "testimonials",
  "profiles",
  "user_roles",
  "orders",
  "order_items",
  "invoices",
  "whatsapp_messages",
  "discount_coupons",
  "coupon_redemptions",
  "loyalty_settings",
  "loyalty_rewards",
  "loyalty_accounts",
  "loyalty_transactions",
  "loyalty_coupons",
] as const;

type TableName = (typeof TABLES)[number];
type StoredFile = { path: string; type: string; data: string };
type Backup = {
  version?: number;
  exported_at?: string;
  tables?: Partial<Record<TableName, Record<string, unknown>[]>>;
  files?: StoredFile[];
} & Partial<Record<TableName, Record<string, unknown>[]>>;

/** Walks every folder of the images bucket and returns all object paths. */
async function listAllFiles(prefix = ""): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const out: string[] = [];
  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) out.push(path);
    else out.push(...(await listAllFiles(path)));
  }
  return out;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string, type: string) {
  const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: type || "application/octet-stream" });
}

function AdminData() {
  const [busy, setBusy] = useState(false);
  const [withImages, setWithImages] = useState(true);
  const [progress, setProgress] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const exportAll = async () => {
    setBusy(true);
    setLog([]);
    const tables: Backup["tables"] = {};
    const lines: string[] = [];
    for (const table of TABLES) {
      setProgress(`تصدير جدول ${table}…`);
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        lines.push(`${table}: تعذّر التصدير (${error.message})`);
        continue;
      }
      tables[table] = (data as Record<string, unknown>[]) ?? [];
      lines.push(`${table}: ${tables[table]?.length ?? 0} سجل`);
    }

    const files: StoredFile[] = [];
    if (withImages) {
      const paths = await listAllFiles();
      let done = 0;
      for (const path of paths) {
        done += 1;
        setProgress(`تنزيل الصور ${done}/${paths.length}…`);
        const { data, error } = await supabase.storage.from(BUCKET).download(path);
        if (error || !data) continue;
        files.push({ path, type: data.type, data: await blobToDataUrl(data) });
      }
      lines.push(`الصور: ${files.length} ملف`);
    }

    setLog(lines);
    const backup: Backup = {
      version: 2,
      exported_at: new Date().toISOString(),
      tables,
      files,
      ...tables,
    };
    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setProgress("");
    setBusy(false);
    toast.success("تم تصدير قاعدة البيانات والصور");
  };

  const importAll = async (file: File) => {
    setBusy(true);
    setLog([]);
    const lines: string[] = [];
    try {
      const backup = JSON.parse(await file.text()) as Backup;
      const tables = backup.tables ?? (backup as Partial<Record<TableName, Record<string, unknown>[]>>);

      const files = backup.files ?? [];
      if (files.length > 0) {
        let done = 0;
        let ok = 0;
        for (const f of files) {
          done += 1;
          setProgress(`رفع الصور ${done}/${files.length}…`);
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(f.path, dataUrlToBlob(f.data, f.type), { upsert: true, contentType: f.type });
          if (!error) ok += 1;
        }
        lines.push(`الصور: تم رفع ${ok} من ${files.length}`);
      }

      for (const table of TABLES) {
        const rows = tables[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        setProgress(`استيراد جدول ${table}…`);
        const { error } = await supabase.from(table).upsert(rows as never, { onConflict: "id" });
        lines.push(
          error ? `${table}: فشل (${error.message})` : `${table}: تم استيراد ${rows.length} سجل`,
        );
      }
      setLog(lines);
      toast.success("انتهى الاستيراد");
    } catch (e) {
      toast.error(`ملف غير صالح: ${(e as Error).message}`);
    } finally {
      setProgress("");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">استيراد وتصدير قاعدة البيانات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نسخة احتياطية كاملة لكل بيانات المتجر (المنتجات، الأقسام، الطلبات، الولاء، الإعدادات)
          مع صور المنتجات والأقسام داخل الملف نفسه. الاستيراد يحدّث السجلات المطابقة ويضيف الجديدة
          ويعيد رفع الصور (لا يحذف شيئاً).
        </p>
      </div>

      <label className="flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={withImages}
          onChange={(e) => setWithImages(e.target.checked)}
          disabled={busy}
        />
        <ImageIcon className="h-4 w-4 text-primary" /> تضمين الصور في النسخة
      </label>

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

      {busy && <p className="text-sm text-muted-foreground">{progress || "جاري التنفيذ…"}</p>}

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
