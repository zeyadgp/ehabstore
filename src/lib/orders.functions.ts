import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().max(60).optional().nullable(),
  address: z.string().trim().min(5).max(200),
  notes: z.string().trim().max(400).optional().nullable(),
  currency: z.string().trim().min(2).max(16).optional(),
  paymentMethod: z.string().trim().max(80).optional().nullable(),
  receiptUrl: z.string().trim().max(300).optional().nullable(),
  couponCode: z.string().trim().max(20).optional().nullable(),
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
  deliveryFee: number;
  items: { name: string; quantity: number; price: number }[];
  discount: number;
  couponCode: string | null;
  pointsEarned: number;
  pointsBalance: number;
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
      .select(
        "store_name, currency, currency_label, whatsapp_number, delivery_enabled, delivery_default_fee, free_delivery_until",
      )
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

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    const loyalty = await import("@/lib/loyalty.server");
    const loySettings = await loyalty.getSettings(supabaseAdmin);
    const loyaltyActive = Boolean(loySettings?.is_active);
    const loyaltyRate = loySettings
      ? await loyalty.currencyRate(supabaseAdmin, loySettings.base_currency)
      : 1;

    // كوبون الولاء (إن وُجد)
    let discount = 0;
    let appliedCoupon: { id: string; code: string } | null = null;
    if (loyaltyActive && data.couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("loyalty_coupons")
        .select("id, code, status, discount_type, discount_value, expires_at")
        .eq("code", data.couponCode.trim().toUpperCase())
        .maybeSingle();
      const valid =
        coupon &&
        coupon.status === "available" &&
        (!coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now());
      if (valid && coupon) {
        if (coupon.discount_type === "percent") {
          discount = roundMoney((subtotal * Number(coupon.discount_value)) / 100);
        } else {
          const inStore = Number(coupon.discount_value) / (loyaltyRate || 1);
          discount = roundMoney(inStore * currencyRate);
        }
        discount = Math.min(discount, subtotal);
        appliedCoupon = { id: coupon.id, code: coupon.code };
      }
    }

    // كوبون خصم عام / كود إحالة شخصي
    let appliedDiscountCoupon: { id: string; code: string; owner_phone: string | null } | null = null;
    if (!appliedCoupon && data.couponCode) {
      const now = Date.now();
      const { data: dc } = await supabaseAdmin
        .from("discount_coupons")
        .select(
          "id, code, discount_type, discount_value, min_order, is_active, starts_at, expires_at, max_uses, used_count, owner_phone",
        )
        .eq("code", data.couponCode.trim().toUpperCase())
        .maybeSingle();
      const valid =
        dc &&
        dc.is_active &&
        (!dc.starts_at || new Date(dc.starts_at).getTime() <= now) &&
        (!dc.expires_at || new Date(dc.expires_at).getTime() > now) &&
        (dc.max_uses === null || Number(dc.used_count) < Number(dc.max_uses)) &&
        subtotal >= Number(dc.min_order ?? 0);
      if (valid && dc) {
        discount =
          dc.discount_type === "percent"
            ? roundMoney((subtotal * Number(dc.discount_value)) / 100)
            : roundMoney((Number(dc.discount_value) / (loyaltyRate || 1)) * currencyRate);
        discount = Math.min(discount, subtotal);
        appliedDiscountCoupon = { id: dc.id, code: dc.code, owner_phone: dc.owner_phone };
      }
    }

    // رسوم التوصيل حسب المحافظة + فترة التوصيل المجاني
    let deliveryFee = 0;
    const freeUntil = settings?.free_delivery_until ? new Date(settings.free_delivery_until).getTime() : 0;
    const freeActive = freeUntil > Date.now();
    if (settings?.delivery_enabled !== false && !freeActive) {
      const { data: zones } = await supabaseAdmin
        .from("delivery_zones")
        .select("governorate, fee, is_active");
      const zone = zones?.find((z) => z.is_active && z.governorate.trim() === data.city.trim());
      const baseFee = Number(zone?.fee ?? settings?.delivery_default_fee ?? 2000) || 0;
      deliveryFee = roundMoney((baseFee / (loyaltyRate || 1)) * currencyRate);
    }

    const total = Math.max(0, roundMoney(subtotal - discount + deliveryFee));

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.name,
        phone: data.phone,
        city: data.city,
        district: data.district ?? null,
        address: data.address,
        notes: data.notes ?? null,
        total,
        delivery_fee: deliveryFee,
        payment_status: data.receiptUrl ? "pending" : "unpaid",
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

    // تسجيل استخدام كوبون الخصم / كود الإحالة
    if (appliedDiscountCoupon) {
      try {
        await supabaseAdmin.from("coupon_redemptions").insert({
          coupon_id: appliedDiscountCoupon.id,
          code: appliedDiscountCoupon.code,
          order_id: order.id,
          order_number: order.order_number ?? null,
          customer_phone: data.phone,
          customer_name: data.name,
          discount_amount: discount,
          order_total: total,
        });
        const { data: cur } = await supabaseAdmin
          .from("discount_coupons")
          .select("used_count")
          .eq("id", appliedDiscountCoupon.id)
          .maybeSingle();
        await supabaseAdmin
          .from("discount_coupons")
          .update({ used_count: Number(cur?.used_count ?? 0) + 1 })
          .eq("id", appliedDiscountCoupon.id);
      } catch {
        // لا نُفشل الطلب بسبب تسجيل الكوبون
      }
    }

    // نقاط الولاء
    let pointsEarned = 0;
    let pointsBalance = 0;
    if (loyaltyActive && loySettings) {
      try {
        const account = await loyalty.ensureAccount(supabaseAdmin, data.phone, data.name);
        const loyaltyAmount = loyalty.toLoyaltyAmount(total, currencyRate, loyaltyRate);
        pointsEarned = loyalty.pointsFor(loyaltyAmount, loySettings.amount_per_point);
        pointsBalance = Number(account.points ?? 0);
        if (pointsEarned > 0) {
          await supabaseAdmin
            .from("loyalty_accounts")
            .update({
              pending_points: Number(account.pending_points ?? 0) + pointsEarned,
              total_spent: Number(account.total_spent ?? 0) + loyaltyAmount,
              customer_name: account.customer_name ?? data.name,
            })
            .eq("id", account.id);
          await supabaseAdmin.from("loyalty_transactions").insert({
            account_id: account.id,
            type: "pending",
            points: pointsEarned,
            order_id: order.id,
            order_number: order.order_number ?? null,
            description: `نقاط بانتظار تأكيد الطلب #${order.order_number}`,
          });
        }
        if (appliedCoupon) {
          await supabaseAdmin
            .from("loyalty_coupons")
            .update({ status: "used", used_order_id: order.id })
            .eq("id", appliedCoupon.id);
          await supabaseAdmin.from("loyalty_transactions").insert({
            account_id: account.id,
            type: "coupon",
            points: 0,
            order_id: order.id,
            order_number: order.order_number ?? null,
            description: `استخدام كوبون ${appliedCoupon.code} في الطلب #${order.order_number}`,
          });
        }
      } catch {
        // لا نُفشل الطلب بسبب نظام الولاء
      }
    }

    return {
      orderNumber: order.order_number ?? null,
      total,
      currency: currencyCode,
      currencyLabel,
      storeName: settings?.store_name ?? "إيهاب ستور للعناية والتجميل",
      whatsappNumber: settings?.whatsapp_number ?? "967780187409",
      paymentMethod: data.paymentMethod ?? null,
      deliveryFee,
      items: lines.map((l) => ({ name: l.product_name, quantity: l.quantity, price: l.price })),
      discount,
      couponCode: appliedCoupon?.code ?? appliedDiscountCoupon?.code ?? null,
      pointsEarned,
      pointsBalance,
    };
  });
