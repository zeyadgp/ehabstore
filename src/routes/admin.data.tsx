import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startExport, startImport, useBackupTask, clearBackupTask } from "@/lib/backup";

export const Route = createFileRoute("/admin/data")({ component: AdminData });

function AdminData() {
  const [withImages, setWithImages] = useState(true);
  const task = useBackupTask();
  const busy = task.running;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">استيراد وتصدير قاعدة البيانات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نسخة احتياطية كاملة لكل بيانات المتجر (المنتجات، الأقسام، الطلبات، الولاء، الإعدادات)
          مع صور المنتجات والأقسام داخل الملف نفسه. العملية تعمل في الخلفية — يمكنكِ التنقّل بين
          صفحات لوحة التحكم أثناء تنفيذها.
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
          onClick={() => {
            clearBackupTask();
            startExport(withImages);
            toast.info("بدأ التصدير في الخلفية");
          }}
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              clearBackupTask();
              startImport(file);
              toast.info("بدأ الاستيراد في الخلفية");
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {(busy || task.percent > 0) && (
        <div className="space-y-2 rounded-3xl border border-border bg-card p-4 shadow-soft">
          <p className="flex items-center gap-2 text-sm font-bold">
            {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {task.progress || (task.error ? "توقفت العملية" : "جاهز")}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full gradient-gold transition-all"
              style={{ width: `${task.percent}%` }}
            />
          </div>
          {task.error && <p className="text-xs font-bold text-destructive">{task.error}</p>}
        </div>
      )}

      {task.log.length > 0 && (
        <ul className="space-y-1 rounded-3xl border border-border bg-card p-4 text-xs shadow-soft">
          {task.log.map((l) => (
            <li key={l} dir="auto">{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
