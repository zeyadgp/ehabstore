import type { CartItem } from "./cart";

export type CheckoutInfo = {
  name: string;
  phone: string;
  city: string;
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
}) {
  const { storeName, orderNumber, info, items, total, currencyLabel } = opts;
  const lines = [
    `* طلب جديد من ${storeName} *`,
    orderNumber ? `رقم الطلب: #${orderNumber}` : null,
    "",
    "- بيانات العميل:",
    `الاسم: ${info.name}`,
    `الهاتف: ${info.phone}`,
    `المدينة: ${info.city}`,
    `العنوان: ${info.address}`,
    info.notes ? `ملاحظات: ${info.notes}` : null,
    "",
    "- المنتجات:",
    ...items.map(
      (i, idx) => `${idx + 1}. ${i.name} x ${i.quantity} = ${money(i.price * i.quantity, currencyLabel)}`,
    ),
    "",
    `- الإجمالي: ${money(total, currencyLabel)}`,
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
