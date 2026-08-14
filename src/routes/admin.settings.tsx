import { createFileRoute } from "@tanstack/react-router";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  return (
    <SettingsForm
      title="إعدادات المتجر"
      fields={[
        { key: "store_name", label: "اسم المتجر" },
        { key: "logo", label: "شعار المتجر", type: "image" },
        {
          key: "grid_columns",
          label: "عدد المنتجات في الصف (الجوال)",
          type: "select",
          numeric: true,
          options: [
            { value: "2", label: "منتجان" },
            { value: "3", label: "ثلاثة منتجات" },
          ],
        },
        {
          key: "card_style",
          label: "شكل بطاقة المنتج",
          type: "select",
          options: [
            { value: "classic", label: "الشكل الحالي" },
            { value: "modern", label: "الشكل الجديد" },
          ],
        },
        { key: "store_image", label: "صورة واجهة المتجر", type: "image" },
        { key: "description", label: "وصف المتجر", type: "textarea" },
        { key: "whatsapp_number", label: "رقم واتساب الطلبات", type: "ltr", hint: "بصيغة دولية بدون +" },
        { key: "phone", label: "رقم الهاتف", type: "ltr" },
        { key: "email", label: "البريد الإلكتروني", type: "ltr" },
        { key: "address", label: "العنوان" },
        { key: "working_hours", label: "ساعات العمل" },
        { key: "instagram", label: "رابط إنستغرام", type: "ltr" },
        { key: "facebook", label: "رابط فيسبوك", type: "ltr" },
        { key: "tiktok", label: "رابط تيك توك", type: "ltr" },
        { key: "snapchat", label: "رابط سناب شات", type: "ltr" },
        { key: "twitter", label: "رابط إكس (تويتر)", type: "ltr" },
        { key: "youtube", label: "رابط يوتيوب", type: "ltr" },
      ]}
    />
  );
}
