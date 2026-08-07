import { createFileRoute } from "@tanstack/react-router";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  return (
    <SettingsForm
      title="إعدادات المتجر"
      fields={[
        { key: "store_name", label: "اسم المتجر" },
        { key: "whatsapp_number", label: "رقم واتساب الطلبات", type: "ltr", hint: "بصيغة دولية بدون +" },
        { key: "currency", label: "رمز العملة (SAR, YER, USD…)", type: "ltr" },
        { key: "currency_label", label: "اسم العملة المعروض", hint: "مثال: ر.س" },
        { key: "phone", label: "رقم الهاتف", type: "ltr" },
        { key: "email", label: "البريد الإلكتروني", type: "ltr" },
        { key: "address", label: "العنوان" },
        { key: "working_hours", label: "ساعات العمل" },
        { key: "instagram", label: "رابط إنستغرام", type: "ltr" },
        { key: "facebook", label: "رابط فيسبوك", type: "ltr" },
        { key: "tiktok", label: "رابط تيك توك", type: "ltr" },
        { key: "snapchat", label: "رابط سناب شات", type: "ltr" },
      ]}
    />
  );
}
