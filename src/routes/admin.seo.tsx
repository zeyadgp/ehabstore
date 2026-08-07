import { createFileRoute } from "@tanstack/react-router";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const Route = createFileRoute("/admin/seo")({ component: AdminSeo });

function AdminSeo() {
  return (
    <SettingsForm
      title="تحسين الظهور في محركات البحث"
      fields={[
        { key: "seo_title", label: "عنوان الصفحة (Title)", hint: "يفضل أقل من 60 حرفاً" },
        { key: "seo_keywords", label: "الكلمات المفتاحية", hint: "افصلي بينها بفاصلة" },
        { key: "seo_description", label: "وصف الموقع (Description)", type: "textarea", hint: "يفضل أقل من 160 حرفاً" },
        { key: "og_image", label: "رابط صورة المشاركة (OG Image)", type: "ltr" },
      ]}
    />
  );
}
