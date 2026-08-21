import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeYemeniPhone } from "@/lib/yemen";

export type MyOrder = {
  id: string;
  order_number: number;
  status: string;
  total: number;
  currency_label: string;
  created_at: string;
  items: { product_name: string; quantity: number }[];
};

/** طلبات العميل الحالي مرتبطة برقم الجوال المحفوظ في ملفه الشخصي. */
export const myOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyOrder[]> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("phone")
      .eq("id", context.userId)
      .maybeSingle();
    const phone = (profile as { phone: string | null } | null)?.phone;
    if (!phone) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total, currency_label, created_at, order_items(product_name, quantity)")
      .eq("phone", normalizeYemeniPhone(phone))
      .order("created_at", { ascending: false })
      .limit(30);

    return ((data ?? []) as unknown as (MyOrder & { order_items: MyOrder["items"] })[]).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: Number(o.total),
      currency_label: o.currency_label,
      created_at: o.created_at,
      items: o.order_items ?? [],
    }));
  });

const avatarSchema = z.object({ dataUrl: z.string().min(20).max(4_000_000) });

/** رفع صورة البروفايل إلى مخزن المتجر وإرجاع مسارها. */
export const uploadAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => avatarSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ path: string }> => {
    const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(data.dataUrl);
    if (!match) throw new Error("صيغة الصورة غير مدعومة");
    const contentType = match[1] as string;
    const bytes = Buffer.from(match[2] as string, "base64");
    if (bytes.byteLength > 3 * 1024 * 1024) throw new Error("حجم الصورة كبير (الحد 3MB)");
    const ext = (contentType.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
    const path = `avatars/${context.userId}-${Date.now()}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("store-images")
      .upload(path, bytes, { contentType, upsert: true });
    if (error) throw new Error(error.message);
    return { path };
  });

const phoneLoginSchema = z.object({
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(6).max(72),
});

export type PhoneLoginResult = { access_token: string; refresh_token: string };

/**
 * دخول برقم الجوال: نطابق الرقم مع الملف الشخصي داخل الخادم ثم ننفّذ الدخول،
 * بحيث لا يُكشف بريد أي عميل للمتصفح.
 */
export const signInWithPhone = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => phoneLoginSchema.parse(data))
  .handler(async ({ data }): Promise<PhoneLoginResult> => {
    const generic = new Error("بيانات الدخول غير صحيحة");
    const phone = normalizeYemeniPhone(data.phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("id, phone")
      .limit(2000);
    const match = ((rows ?? []) as { id: string; phone: string | null }[]).find(
      (r) => r.phone && normalizeYemeniPhone(r.phone) === phone,
    );
    if (!match) throw generic;

    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(match.id);
    const email = userRes?.user?.email;
    if (!email) throw generic;

    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: session, error } = await client.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (error || !session.session) throw generic;
    return {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
    };
  });
