import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeYemeniPhone } from "@/lib/yemen";

export type LoyaltyTx = {
  id: string;
  type: string;
  points: number;
  order_number: number | null;
  description: string | null;
  created_at: string;
};

export type LoyaltyCoupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  status: string;
  expires_at: string | null;
  created_at: string;
};

export type LoyaltyOverview = {
  found: boolean;
  phone: string;
  name: string | null;
  points: number;
  pendingPoints: number;
  totalSpent: number;
  settings: {
    isActive: boolean;
    baseCurrency: string;
    amountPerPoint: number;
    minRedeemPoints: number;
    pointValue: number;
  } | null;
  nextReward: { name: string; pointsRequired: number } | null;
  transactions: LoyaltyTx[];
  coupons: LoyaltyCoupon[];
};

const phoneSchema = z.object({ phone: z.string().trim().min(7).max(20) });

export const getLoyaltyOverview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => phoneSchema.parse(data))
  .handler(async ({ data }): Promise<LoyaltyOverview> => {
    const { admin, getSettings } = await import("@/lib/loyalty.server");
    const db = await admin();
    const phone = normalizeYemeniPhone(data.phone);
    const settingsRow = await getSettings(db);

    const { data: account } = await db
      .from("loyalty_accounts")
      .select("id, phone, customer_name, points, pending_points, total_spent")
      .eq("phone", phone)
      .maybeSingle();

    const { data: rewards } = await db
      .from("loyalty_rewards")
      .select("name, points_required")
      .eq("is_active", true)
      .order("points_required");

    const points = Number(account?.points ?? 0);
    const nextReward =
      rewards?.find((r) => Number(r.points_required) > points) ??
      rewards?.[rewards.length - 1] ??
      null;

    const settings = settingsRow
      ? {
          isActive: settingsRow.is_active,
          baseCurrency: settingsRow.base_currency,
          amountPerPoint: Number(settingsRow.amount_per_point),
          minRedeemPoints: settingsRow.min_redeem_points,
          pointValue: Number(settingsRow.point_value),
        }
      : null;

    if (!account) {
      return {
        found: false,
        phone,
        name: null,
        points: 0,
        pendingPoints: 0,
        totalSpent: 0,
        settings,
        nextReward: nextReward
          ? { name: nextReward.name, pointsRequired: Number(nextReward.points_required) }
          : null,
        transactions: [],
        coupons: [],
      };
    }

    const { data: txs } = await db
      .from("loyalty_transactions")
      .select("id, type, points, order_number, description, created_at")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: coupons } = await db
      .from("loyalty_coupons")
      .select("id, code, discount_type, discount_value, status, expires_at, created_at")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(30);

    return {
      found: true,
      phone,
      name: account.customer_name,
      points,
      pendingPoints: Number(account.pending_points ?? 0),
      totalSpent: Number(account.total_spent ?? 0),
      settings,
      nextReward: nextReward
        ? { name: nextReward.name, pointsRequired: Number(nextReward.points_required) }
        : null,
      transactions: (txs ?? []).map((t) => ({ ...t, points: Number(t.points) })) as LoyaltyTx[],
      coupons: (coupons ?? []).map((c) => ({
        ...c,
        discount_value: Number(c.discount_value),
      })) as LoyaltyCoupon[],
    };
  });

export const redeemReward = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ phone: z.string().trim().min(7).max(20), rewardId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ code: string; expiresAt: string | null }> => {
    const { admin, getSettings, couponCode } = await import("@/lib/loyalty.server");
    const db = await admin();
    const phone = normalizeYemeniPhone(data.phone);
    const settings = await getSettings(db);
    if (!settings?.is_active) throw new Error("برنامج الولاء غير مفعّل حالياً");

    const { data: account } = await db
      .from("loyalty_accounts")
      .select("id, points")
      .eq("phone", phone)
      .maybeSingle();
    if (!account) throw new Error("لا يوجد رصيد نقاط لهذا الرقم");

    const { data: reward } = await db
      .from("loyalty_rewards")
      .select("id, name, points_required, discount_type, discount_value, is_active")
      .eq("id", data.rewardId)
      .maybeSingle();
    if (!reward || !reward.is_active) throw new Error("المكافأة غير متاحة");

    const required = Number(reward.points_required);
    if (Number(account.points) < required) throw new Error("نقاطك غير كافية لهذه المكافأة");
    if (required < settings.min_redeem_points) throw new Error("لم تصل بعد للحد الأدنى للاستبدال");

    const expiresAt = new Date(
      Date.now() + (settings.coupon_expiry_days || 60) * 24 * 60 * 60 * 1000,
    ).toISOString();
    const code = couponCode();

    const { error: cErr } = await db.from("loyalty_coupons").insert({
      code,
      account_id: account.id,
      reward_id: reward.id,
      discount_type: reward.discount_type,
      discount_value: reward.discount_value,
      points_spent: required,
      status: "available",
      expires_at: expiresAt,
    });
    if (cErr) throw new Error(cErr.message);

    await db
      .from("loyalty_accounts")
      .update({ points: Number(account.points) - required })
      .eq("id", account.id);

    await db.from("loyalty_transactions").insert({
      account_id: account.id,
      type: "redeem",
      points: -required,
      description: `استبدال مكافأة: ${reward.name} — كوبون ${code}`,
    });

    return { code, expiresAt };
  });

/** تأكيد نقاط طلب مكتمل أو إلغاؤها — للمسؤولين فقط */
export const syncOrderPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ orderId: z.string().uuid(), status: z.string().trim().min(2).max(20) })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; points: number }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { admin } = await import("@/lib/loyalty.server");
    const db = await admin();

    const { data: order } = await db
      .from("orders")
      .select("id, order_number, phone, status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) return { ok: false, points: 0 };

    const { normalizeYemeniPhone: norm } = await import("@/lib/yemen");
    const { data: account } = await db
      .from("loyalty_accounts")
      .select("id, points, pending_points")
      .eq("phone", norm(order.phone))
      .maybeSingle();
    if (!account) return { ok: false, points: 0 };

    const { data: pendingTx } = await db
      .from("loyalty_transactions")
      .select("id, points, type")
      .eq("account_id", account.id)
      .eq("order_id", order.id)
      .eq("type", "pending");

    const pending = (pendingTx ?? []).reduce((s, t) => s + Number(t.points), 0);
    if (pending <= 0) return { ok: false, points: 0 };

    if (data.status === "completed") {
      await db
        .from("loyalty_accounts")
        .update({
          points: Number(account.points) + pending,
          pending_points: Math.max(0, Number(account.pending_points) - pending),
        })
        .eq("id", account.id);
      await db
        .from("loyalty_transactions")
        .update({ type: "earn", description: `نقاط مؤكدة للطلب #${order.order_number}` })
        .eq("account_id", account.id)
        .eq("order_id", order.id)
        .eq("type", "pending");
      return { ok: true, points: pending };
    }

    if (data.status === "cancelled") {
      await db
        .from("loyalty_accounts")
        .update({ pending_points: Math.max(0, Number(account.pending_points) - pending) })
        .eq("id", account.id);
      await db
        .from("loyalty_transactions")
        .update({ type: "cancelled", points: 0, description: `أُلغيت نقاط الطلب #${order.order_number}` })
        .eq("account_id", account.id)
        .eq("order_id", order.id)
        .eq("type", "pending");
      return { ok: true, points: -pending };
    }

    return { ok: false, points: 0 };
  });

/** إدارة النقاط يدوياً من لوحة التحكم */
export const adjustPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        phone: z.string().trim().min(7).max(20),
        points: z.number().int().min(-100000).max(100000),
        reason: z.string().trim().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ points: number }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { admin, ensureAccount } = await import("@/lib/loyalty.server");
    const db = await admin();
    const account = await ensureAccount(db, data.phone);
    const next = Math.max(0, Number(account.points) + data.points);
    await db.from("loyalty_accounts").update({ points: next }).eq("id", account.id);
    await db.from("loyalty_transactions").insert({
      account_id: account.id,
      type: "adjust",
      points: data.points,
      description: data.reason ?? "تعديل يدوي من لوحة التحكم",
    });
    return { points: next };
  });
