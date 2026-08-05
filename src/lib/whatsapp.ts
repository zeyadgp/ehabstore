import type { CartItem } from "./cart";

export type CheckoutInfo = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
};

export function buildWhatsappMessage(opts: {
  storeName: string;
  orderNumber?: number | null;
  info: CheckoutInfo;
  items: CartItem[];
  total: number;
  currencyLabel: string;
}) {
  const { storeName, orderNumber, info, items, total, currencyLabel } = opts;
  const lines = [
    `🌸 طلب جديد من ${storeName}`,
    orderNumber ? `رقم الطلب: #${orderNumber}` : null,
    "",
    "👤 بيانات العميل:",
    `الاسم: ${info.name}`,
    `الهاتف: ${info.phone}`,
    `المدينة: ${info.city}`,
    `العنوان: ${info.address}`,
    info.notes ? `ملاحظات: ${info.notes}` : null,
    "",
    "🛍️ المنتجات:",
    ...items.map(
      (i, idx) =>
        `${idx + 1}. ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString("ar-EG")} ${currencyLabel}`,
    ),
    "",
    `💰 الإجمالي: ${total.toLocaleString("ar-EG")} ${currencyLabel}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export function whatsappLink(number: string, message: string) {
  const clean = (number || "").replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}