import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { InternalSettingsCard } from "@/components/admin/InternalSettingsCard";
import { useSettings } from "@/lib/store";
import { useActiveTheme } from "@/lib/theme";

export const Route = createFileRoute("/settingsin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إعدادات Lovable الداخلية | إيهاب ستور" },
      { name: "description", content: "صفحة تطوير مؤقتة لإعدادات Lovable الداخلية الخاصة بالمشروع." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "إعدادات Lovable الداخلية" },
      { property: "og:description", content: "صفحة تطوير مؤقتة لإعدادات Lovable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsIn,
});

/**
 * Temporary developer-only page for Lovable platform settings.
 * Not part of the admin dashboard — delete before the final release.
 */
function SettingsIn() {
  const { data: settings } = useSettings();
  const theme = useActiveTheme();

  const rows: { label: string; value: string }[] = [
    { label: "اسم المتجر", value: settings?.store_name ?? "—" },
    { label: "المظهر المفعّل", value: theme?.name ?? "—" },
    { label: "العملة الافتراضية", value: settings?.currency ?? "—" },
    { label: "زر Edit with Lovable", value: settings?.hide_lovable_badge === false ? "ظاهر" : "مخفي" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-32">
      <div className="flex items-start gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <h1 className="text-lg font-extrabold">إعدادات Lovable الداخلية</h1>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            صفحة مؤقتة للتطوير فقط، لا علاقة لها بلوحة تحكم الأدمن، وسيتم حذفها عند رفع النسخة
            النهائية. الرابط غير مفهرس في محركات البحث.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-extrabold">خيارات Lovable</h2>
        <InternalSettingsCard />
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          إخفاء أو إظهار زر «Edit with Lovable» يطبّق على الموقع المنشور والمعاينة معاً.
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-extrabold">حالة المشروع</h2>
        <dl className="mt-3 divide-y divide-border text-xs">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 py-2">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="font-bold">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-extrabold">روابط سريعة</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <Link to="/admin" className="rounded-xl bg-secondary px-4 py-2 text-primary">لوحة التحكم</Link>
          <Link to="/admin/appearance" className="rounded-xl bg-secondary px-4 py-2 text-primary">إعدادات المظهر</Link>
          <Link to="/" className="rounded-xl bg-secondary px-4 py-2 text-primary">المتجر</Link>
          <a
            href="https://docs.lovable.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-xl border border-border px-4 py-2"
          >
            وثائق Lovable <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
