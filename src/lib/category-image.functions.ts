import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateAndStore } from "@/lib/ai-image.server";

/** Generates a brand-styled illustration for a category (optional helper in the dashboard). */
export const generateCategoryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; kind?: "icon" | "cover" }) => ({
    name: (input?.name ?? "قسم").slice(0, 80),
    kind: input?.kind === "cover" ? ("cover" as const) : ("icon" as const),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("غير مصرح");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("مفتاح الذكاء الاصطناعي غير متوفر");

    const base =
      `Elegant minimal beauty-store artwork for a shop category named "${data.name}". ` +
      "Brand identity: soft gold (#C9A227) and blush rose (#E8B4B8) line art on a very light warm background. " +
      "Delicate luxury illustration of the relevant products, centered, generous padding, " +
      "no text, no letters, no logo, no watermark.";
    const prompt =
      data.kind === "cover"
        ? `${base} Wide banner composition, 16:9, soft negative space on one side.`
        : `${base} Square 1:1 icon-style composition.`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return generateAndStore(apiKey, prompt, "categories", supabaseAdmin as never);
  });
