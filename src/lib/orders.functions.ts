import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(200),
  notes: z.string().trim().max(400).optional().nullable(),
  currency: z.string().trim().min(2).max(16).optional(),
  paymentMethod: z.string().trim().max(80).optional().nullable(),
  receiptUrl: z.string().trim().max(300).optional().nullable(),
  items: z
    .array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50),
});

export type PlacedOrder = {
  orderNumber: number | null;
  total: number;
  currency: string;
  currencyLabel: string;
  storeName: string;
  whatsappNumber: string;
  paymentMethod: string | null;
  items: { name: string; quantity: number; price: number }[];
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<PlacedOrder> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => i.id);
    const { data: products, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, discount_price, status")
      .in("id", ids);
    if (prodError) throw new Error(prodError.message);

    const { data: settings } = await supabaseAdmin
      .from("store_settings")
      .select("store_name, currency, currency_label, whatsapp_number")
      .limit(1)
      .maybeSingle();

    const { data: currencies } = await supabaseAdmin
      .from("currencies")
      .select("code, symbol, rate, is_default, is_active")
      .eq("is_active", true);

    const fallbackCurrency =
      currencies?.find((c) => c.is_default) ?? currencies?.[0] ?? null;
    const chosen =
      currencies?.find((c) => c.code === (data.currency ?? "")) ?? fallbackCurrency;
    const currencyCode = chosen?.code ?? settings?.currency ?? "SAR";
    const currencyLabel = chosen?.symbol ?? settings?.currency_label ?? "ر.س";
    const currencyRate = Number(chosen?.rate ?? 1) || 1;
    const roundMoney = (v: number) =>
      currencyCode.startsWith("YER") ? Math.round(v) : Math.round(v * 100) / 100;

    const { data: overrides } = await supabaseAdmin
      .from("product_prices")
      .select("product_id, price, discount_price")
      .eq("currency_code", currencyCode)
      .in("product_id", ids);

    const lines = data.items
      .map((item) => {
        const p = products?.find((x) => x.id === item.id);
        if (!p || p.status !== true) return null;
        const base =
          p.discount_price != null && Number(p.discount_price) > 0
            ? Number(p.discount_price)
            : Number(p.price);
        const o = overrides?.find((x) => x.product_id === p.id);
        const override =
          o?.discount_price != null && Number(o.discount_price) > 0
            ? Number(o.discount_price)
            : o?.price != null && Number(o.price) > 0
              ? Number(o.price)
              : null;
        const unit = override ?? roundMoney(base * currencyRate);
        return { product_id: p.id, product_name: p.name, price: unit, quantity: item.quantity };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    if (lines.length === 0) throw new Error("لا توجد منتجات متاحة في الطلب");

    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        notes: data.notes ?? null,
        total,
        currency: currencyCode,
        currency_label: currencyLabel,
        currency_rate: currencyRate,
        payment_method: data.paymentMethod ?? null,
        receipt_url: data.receiptUrl ?? null,
      })
      .select("id, order_number")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) throw new Error(itemsError.message);

    return {
      orderNumber: order.order_number ?? null,
      total,
      currency: currencyCode,
      currencyLabel,
      storeName: settings?.store_name ?? "إيهاب ستور للعناية والتجميل",
      whatsappNumber: settings?.whatsapp_number ?? "967780187409",
      paymentMethod: data.paymentMethod ?? null,
      items: lines.map((l) => ({ name: l.product_name, quantity: l.quantity, price: l.price })),
    };
  });
