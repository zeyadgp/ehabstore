import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "@/lib/store";

/** جداول النسخة الاحتياطية (الترتيب مهم بسبب المفاتيح الأجنبية). */
export const BACKUP_TABLES = [
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

export type TableName = (typeof BACKUP_TABLES)[number];
type StoredFile = { path: string; type: string; data: string };
export type Backup = {
  version?: number;
  exported_at?: string;
  tables?: Partial<Record<TableName, Record<string, unknown>[]>>;
  files?: StoredFile[];
} & Partial<Record<TableName, Record<string, unknown>[]>>;

export type BackupTask = {
  kind: "export" | "import" | null;
  running: boolean;
  progress: string;
  percent: number;
  log: string[];
  finishedAt: number | null;
  error: string | null;
};

const idle: BackupTask = {
  kind: null,
  running: false,
  progress: "",
  percent: 0,
  log: [],
  finishedAt: null,
  error: null,
};

// حالة عامة خارج React: العملية تستمر حتى عند مغادرة الصفحة.
let state: BackupTask = idle;
const listeners = new Set<() => void>();

function set(patch: Partial<BackupTask>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useBackupTask(): BackupTask {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => idle,
  );
}

export function clearBackupTask() {
  if (state.running) return;
  set({ ...idle });
}

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

let unloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

function lockTab() {
  if (typeof window === "undefined" || unloadHandler) return;
  unloadHandler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };
  window.addEventListener("beforeunload", unloadHandler);
}

function unlockTab() {
  if (typeof window === "undefined" || !unloadHandler) return;
  window.removeEventListener("beforeunload", unloadHandler);
  unloadHandler = null;
}

/** يصدّر كل الجداول (واختيارياً الصور) في الخلفية ثم ينزّل الملف. */
export function startExport(withImages: boolean) {
  if (state.running) return;
  set({ kind: "export", running: true, progress: "بدء التصدير…", percent: 1, log: [], error: null, finishedAt: null });
  lockTab();
  void (async () => {
    const lines: string[] = [];
    try {
      const tables: Backup["tables"] = {};
      const total = BACKUP_TABLES.length;
      for (let i = 0; i < total; i += 1) {
        const table = BACKUP_TABLES[i] as TableName;
        set({ progress: `تصدير جدول ${table}…`, percent: Math.round(((i + 1) / total) * (withImages ? 40 : 95)) });
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
        for (let i = 0; i < paths.length; i += 1) {
          const path = paths[i] as string;
          set({
            progress: `تنزيل الصور ${i + 1}/${paths.length}…`,
            percent: 40 + Math.round(((i + 1) / Math.max(paths.length, 1)) * 55),
          });
          const { data, error } = await supabase.storage.from(BUCKET).download(path);
          if (error || !data) continue;
          files.push({ path, type: data.type, data: await blobToDataUrl(data) });
        }
        lines.push(`الصور: ${files.length} ملف`);
      }

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
      set({ running: false, percent: 100, progress: "اكتمل التصدير", log: lines, finishedAt: Date.now() });
    } catch (e) {
      set({ running: false, error: (e as Error).message, log: lines, finishedAt: Date.now(), progress: "" });
    } finally {
      unlockTab();
    }
  })();
}

/** يستورد نسخة احتياطية (صور + جداول) في الخلفية. */
export function startImport(file: File) {
  if (state.running) return;
  set({ kind: "import", running: true, progress: "قراءة الملف…", percent: 1, log: [], error: null, finishedAt: null });
  lockTab();
  void (async () => {
    const lines: string[] = [];
    try {
      const backup = JSON.parse(await file.text()) as Backup;
      const tables =
        backup.tables ?? (backup as Partial<Record<TableName, Record<string, unknown>[]>>);

      const files = backup.files ?? [];
      let ok = 0;
      for (let i = 0; i < files.length; i += 1) {
        const f = files[i] as StoredFile;
        set({
          progress: `رفع الصور ${i + 1}/${files.length}…`,
          percent: Math.round(((i + 1) / files.length) * 50),
        });
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(f.path, dataUrlToBlob(f.data, f.type), { upsert: true, contentType: f.type });
        if (!error) ok += 1;
      }
      if (files.length > 0) lines.push(`الصور: تم رفع ${ok} من ${files.length}`);

      const total = BACKUP_TABLES.length;
      for (let i = 0; i < total; i += 1) {
        const table = BACKUP_TABLES[i] as TableName;
        const rows = tables[table];
        set({
          progress: `استيراد جدول ${table}…`,
          percent: 50 + Math.round(((i + 1) / total) * 49),
        });
        if (!Array.isArray(rows) || rows.length === 0) continue;
        const { error } = await supabase.from(table).upsert(rows as never, { onConflict: "id" });
        lines.push(
          error ? `${table}: فشل (${error.message})` : `${table}: تم استيراد ${rows.length} سجل`,
        );
      }
      set({ running: false, percent: 100, progress: "اكتمل الاستيراد", log: lines, finishedAt: Date.now() });
    } catch (e) {
      set({ running: false, error: (e as Error).message, log: lines, finishedAt: Date.now(), progress: "" });
    } finally {
      unlockTab();
    }
  })();
}
