import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { enhanceProductImage } from "@/lib/ai-image.functions";
import { SmartImage } from "@/components/SmartImage";
import { uploadImage, useAdminCategories, useAllProducts } from "@/lib/admin";
import { fallbackFor } from "@/lib/images";
import { childrenOf, formatMoney, rootCategories, slugify, useSettings, type Product } from "@/lib/store";
import { useCurrencies } from "@/lib/currency";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  discount_price: string;
  category_id: string;
  stock: string;
  status: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  images: string[];
  prices: Record<string, { price: string; discount_price: string }>;
  extra: string[];
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  discount_price: "",
  category_id: "",
  stock: "0",
  status: true,
  is_featured: false,
  is_bestseller: false,
  images: [],
  prices: {},
  extra: [],
};

/** Keeps the many-to-many product↔category links in sync with the draft. */
async function saveLinks(productId: string, mainId: string, extra: string[]) {
  const ids = Array.from(new Set([mainId, ...extra].filter(Boolean)));
  await supabase.from("product_categories").delete().eq("product_id", productId);
  if (ids.length > 0) {
    await supabase
      .from("product_categories")
      .insert(ids.map((category_id) => ({ product_id: productId, category_id })));
  }
}

async function saveOverrides(productId: string, draft: Draft) {
  const entries = Object.entries(draft.prices);
  for (const [code, v] of entries) {
    const price = v.price.trim() === "" ? null : Number(v.price);
    const discount = v.discount_price.trim() === "" ? null : Number(v.discount_price);
    if (price == null && discount == null) {
      await supabase.from("product_prices").delete().eq("product_id", productId).eq("currency_code", code);
      continue;
    }
    await supabase
      .from("product_prices")
      .upsert(
        { product_id: productId, currency_code: code, price, discount_price: discount },
        { onConflict: "product_id,currency_code" },
      );
  }
}

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useAllProducts();
  const { data: categories = [] } = useAdminCategories();
  const { data: settings } = useSettings();
  const { data: currencies = [] } = useCurrencies();
  const { label } = useAdminCurrency();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const enhance = useServerFn(enhanceProductImage);

  const onEnhance = async (path: string) => {
    if (!draft) return;
    setEnhancing(path);
    try {
      const res = await enhance({ data: { path } });
      setDraft((prev) =>
        prev ? { ...prev, images: prev.images.map((i) => (i === path ? res.path : i)) } : prev,
      );
      toast.success("تم تحسين الصورة بالذكاء الاصطناعي");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر تحسين الصورة");
    } finally {
      setEnhancing(null);
    }
  };

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "products"] });
    await qc.invalidateQueries({ queryKey: ["products"] });
    await qc.invalidateQueries({ queryKey: ["product-prices"] });
  };

  const openNew = () => setDraft({ ...emptyDraft });
  const openEdit = async (p: Product) => {
    const { data: rows } = await supabase
      .from("product_prices")
      .select("currency_code, price, discount_price")
      .eq("product_id", p.id);
    const { data: linkRows } = await supabase
      .from("product_categories")
      .select("category_id")
      .eq("product_id", p.id);
    const prices: Draft["prices"] = {};
    (rows ?? []).forEach((r) => {
      prices[r.currency_code] = {
        price: r.price != null ? String(r.price) : "",
        discount_price: r.discount_price != null ? String(r.discount_price) : "",
      };
    });
    setDraft({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      discount_price: p.discount_price != null ? String(p.discount_price) : "",
      category_id: p.category_id ?? "",
      stock: String(p.stock),
      status: p.status,
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      images: p.images ?? [],
      prices,
      extra: (linkRows ?? [])
        .map((r) => r.category_id)
        .filter((id) => id !== p.category_id),
    });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) { toast.error("اسم المنتج مطلوب"); return; }
    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        slug: slugify(draft.name),
        description: draft.description.trim() || null,
        price: Number(draft.price || 0),
        discount_price: draft.discount_price ? Number(draft.discount_price) : null,
        category_id: draft.category_id || null,
        stock: Number(draft.stock || 0),
        status: draft.status,
        is_featured: draft.is_featured,
        is_bestseller: draft.is_bestseller,
        images: draft.images,
      };
      if (draft.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", draft.id);
        if (error) throw error;
        await saveOverrides(draft.id, draft);
        await saveLinks(draft.id, draft.category_id, draft.extra);
      } else {
        const { data: created, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        if (created?.id) {
          await saveOverrides(created.id, draft);
          await saveLinks(created.id, draft.category_id, draft.extra);
        }
      }
      toast.success("تم الحفظ");
      setDraft(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`حذف المنتج "${p.name}"؟`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    await refresh();
  };

  const toggleStatus = async (p: Product) => {
    const { error } = await supabase.from("products").update({ status: !p.status }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  };

  const onUpload = async (files: FileList | null) => {
    if (!files?.length || !draft) return;
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const f of Array.from(files)) paths.push(await uploadImage(f));
      setDraft({ ...draft, images: [...draft.images, ...paths] });
      toast.success("تم رفع الصور");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر رفع الصورة");
    } finally {
      setBusy(false);
    }
  };

  const list = products.filter((p) => !q || p.name.includes(q));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">إدارة المنتجات</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالاسم…"
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <button
          onClick={openNew}
          className="ms-auto flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> منتج جديد
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead className="bg-secondary/60 text-xs">
            <tr>
              <th className="p-3">المنتج</th>
              <th className="p-3">التصنيف</th>
              <th className="p-3">السعر</th>
              <th className="p-3">المخزون</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <SmartImage
                      paths={p.images}
                      fallback={fallbackFor(categories.find((c) => c.id === p.category_id)?.slug)}
                      alt={p.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <span className="font-bold">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {categories.find((c) => c.id === p.category_id)?.name ?? "—"}
                </td>
                <td className="p-3 text-xs font-bold">
                  {formatMoney(Number(p.discount_price ?? p.price), label)}
                </td>
                <td className="p-3 text-xs">{p.stock}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleStatus(p)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      p.status ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status ? "معروض" : "مخفي"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="rounded-lg bg-secondary p-2 text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(p)} className="rounded-lg bg-destructive/10 p-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                  لا توجد منتجات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-4 w-full max-w-2xl rounded-3xl bg-card p-4 shadow-lift sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">{draft.id ? "تعديل منتج" : "منتج جديد"}</h2>
              <button onClick={() => setDraft(null)} className="rounded-lg p-1 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="اسم المنتج">
                <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="التصنيف">
                <select className={inputCls} value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>
                  <option value="">بدون تصنيف</option>
                  {rootCategories(categories).map((c) => {
                    const kids = childrenOf(categories, c.id);
                    if (kids.length === 0) return <option key={c.id} value={c.id}>{c.name}</option>;
                    return (
                      <optgroup key={c.id} label={c.name}>
                        <option value={c.id}>{c.name} (التصنيف الرئيسي)</option>
                        {kids.map((k) => (
                          <option key={k.id} value={k.id}>— {k.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </Field>
              <Field label="أقسام إضافية (يظهر المنتج فيها أيضًا)">
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border p-2">
                  {categories
                    .filter((c) => c.id !== draft.category_id)
                    .map((c) => {
                      const on = draft.extra.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              extra: on
                                ? draft.extra.filter((x) => x !== c.id)
                                : [...draft.extra, c.id],
                            })
                          }
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${on ? "gradient-gold text-primary-foreground" : "bg-secondary text-foreground"}`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                </div>
              </Field>
              <Field label="السعر">
                <input type="number" min="0" step="0.01" className={inputCls} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              </Field>
              <Field label="سعر الخصم (اختياري)">
                <input type="number" min="0" step="0.01" className={inputCls} value={draft.discount_price} onChange={(e) => setDraft({ ...draft, discount_price: e.target.value })} />
              </Field>
              <Field label="المخزون">
                <input type="number" min="0" className={inputCls} value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
              </Field>
              <Field label="صور المنتج">
                <input type="file" accept="image/*" multiple onChange={(e) => onUpload(e.target.files)} className="text-xs" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="الوصف">
                  <textarea rows={4} className={inputCls} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                </Field>
              </div>
            </div>

            {draft.images.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  يمكنك تحسين أي صورة بالذكاء الاصطناعي (خيار اختياري) بالضغط على أيقونة ✨.
                </p>
                <div className="flex flex-wrap gap-3">
                {draft.images.map((img) => (
                  <div key={img} className="relative">
                    <SmartImage paths={[img]} fallback={fallbackFor()} alt="صورة المنتج" className="h-20 w-20 rounded-xl object-cover" />
                    <button
                      type="button"
                      title="تحسين بالذكاء الاصطناعي"
                      disabled={enhancing !== null}
                      onClick={() => onEnhance(img)}
                      className="absolute -bottom-2 -left-2 rounded-full gradient-gold p-1.5 text-primary-foreground disabled:opacity-60"
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${enhancing === img ? "animate-pulse" : ""}`} />
                    </button>
                    <button
                      onClick={() => setDraft({ ...draft, images: draft.images.filter((i) => i !== img) })}
                      className="absolute -top-2 -left-2 rounded-full bg-destructive p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold">
            </div>

            {currencies.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border p-4">
                <p className="text-xs font-bold">أسعار مخصصة لكل عملة (اختياري)</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  اتركيها فارغة ليتم التحويل تلقائياً من السعر الأساسي حسب سعر الصرف.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {currencies
                    .filter((c) => !c.is_default)
                    .map((c) => {
                      const v = draft.prices[c.code] ?? { price: "", discount_price: "" };
                      const setV = (patch: Partial<typeof v>) =>
                        setDraft({ ...draft, prices: { ...draft.prices, [c.code]: { ...v, ...patch } } });
                      return (
                        <div key={c.code} className="rounded-xl bg-secondary/40 p-3">
                          <p className="text-[11px] font-bold">{c.name} ({c.symbol})</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="السعر"
                              className={inputCls}
                              value={v.price}
                              onChange={(e) => setV({ price: e.target.value })}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="سعر الخصم"
                              className={inputCls}
                              value={v.discount_price}
                              onChange={(e) => setV({ discount_price: e.target.value })}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold">
              <Check label="معروض في المتجر" value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} />
              <Check label="منتج مميز" value={draft.is_featured} onChange={(v) => setDraft({ ...draft, is_featured: v })} />
              <Check label="الأكثر مبيعاً" value={draft.is_bestseller} onChange={(v) => setDraft({ ...draft, is_bestseller: v })} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={save} disabled={busy} className="flex-1 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
                حفظ
              </button>
              <button onClick={() => setDraft(null)} className="rounded-xl border border-border px-6 text-sm font-bold">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold">{label}</span>
      {children}
    </label>
  );
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}
