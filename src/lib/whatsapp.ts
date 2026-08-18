import type { CartItem } from "./cart";

export type CheckoutInfo = {
  name: string;
  phone: string;
  city: string;
  district?: string;
  address: string;
  notes?: string;
};

function money(value: number, currencyLabel: string) {
  return `${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currencyLabel}`;
}

export function buildWhatsappMessage(opts: {
  storeName: string;
  orderNumber?: number | null;
  info: CheckoutInfo;
  items: CartItem[];
  total: number;
  currencyLabel: string;
  discount?: number;
  couponCode?: string | null;
  pointsEarned?: number;
  deliveryNote?: string;
}) {
  const {
    storeName,
    orderNumber,
    info,
    items,
    total,
    currencyLabel,
    discount = 0,
    couponCode,
    pointsEarned = 0,
    deliveryNote,
  } = opts;
  const lines = [
    `* طلب جديد من ${storeName} *`,
    orderNumber ? `رقم الطلب: #${orderNumber}` : null,
    "",
    "- بيانات العميل:",
    `الاسم: ${info.name}`,
    `الهاتف: ${info.phone}`,
    `المحافظة: ${info.city}`,
    info.district ? `المديرية/المنطقة: ${info.district}` : null,
    `العنوان: ${info.address}`,
    info.notes ? `ملاحظات: ${info.notes}` : null,
    "",
    "- المنتجات:",
    ...items.map(
      (i, idx) => `${idx + 1}. ${i.name} x ${i.quantity} = ${money(i.price * i.quantity, currencyLabel)}`,
    ),
    "",
    discount > 0 ? `- الخصم${couponCode ? ` (كوبون ${couponCode})` : ""}: ${money(discount, currencyLabel)}` : null,
    `- الإجمالي: ${money(total, currencyLabel)}`,
    pointsEarned > 0 ? `- نقاط الولاء المكتسبة: ${pointsEarned} نقطة (تُعتمد بعد استلام الطلب)` : null,
    deliveryNote ? `\n- التوصيل: ${deliveryNote}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function whatsappLink(number: string, message: string) {
  const clean = (number || "").replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function buildProductMessage(opts: {
  storeName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currencyLabel: string;
}) {
  const { storeName, productName, quantity, unitPrice, currencyLabel } = opts;
  return [
    `مرحباً ${storeName}`,
    "أرغب بطلب المنتج التالي:",
    "",
    `المنتج: ${productName}`,
    `الكمية: ${quantity}`,
    `الإجمالي: ${money(unitPrice * quantity, currencyLabel)}`,
  ].join("\n");
}
