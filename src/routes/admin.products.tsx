import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { enhanceProductImage } from "@/lib/ai-image.functions";
import { SmartImage } from "@/components/SmartImage";
import { uploadImage, useAdminCategories, useAllProducts, useAdminCurrency } from "@/lib/admin";
import { fallbackFor } from "@/lib/images";
import { childrenOf, formatMoney, rootCategories, slugify, type Product } from "@/lib/store";
import { useCurrencies } from "@/lib/currency";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Draft = {
  id?: string;
  name: string;
  sku: string;
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
  sku: "",
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
  const { data: currencies = [] } = useCurrencies();
  const { label } = useAdminCurrency();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");
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
      sku: p.sku ?? "",
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
        sku: draft.sku.trim() || null,
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

  const needle = q.trim().toLowerCase();
  const list = products
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.sku ?? "").toLowerCase().includes(needle))
    .filter((p) => !cat || p.category_id === cat)
    .filter((p) =>
      stockFilter === "all"
        ? true
        : stockFilter === "out"
          ? p.stock === 0
          : stockFilter === "low"
            ? p.stock > 0 && p.stock <= 3
            : p.stock > 3,
    );

  const stats = [
    { label: "إجمالي المنتجات", value: products.length, tone: "bg-secondary text-foreground" },
    { label: "متوفر", value: products.filter((p) => p.status && p.stock > 3).length, tone: "bg-emerald-100 text-emerald-700" },
    { label: "مخزون منخفض", value: products.filter((p) => p.stock > 0 && p.stock <= 3).length, tone: "bg-amber-100 text-amber-700" },
    { label: "نفد المخزون", value: products.filter((p) => p.stock === 0).length, tone: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
        <h1 className="truncate text-2xl font-extrabold">إدارة المنتجات</h1>
        <button
          onClick={openNew}
          className="flex shrink-0 items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground sm:ms-auto"
        >
          <Plus className="h-4 w-4" /> منتج جديد
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <p className="text-[11px] font-bold text-muted-foreground">{s.label}</p>
            <span className={`mt-1 inline-flex rounded-lg px-2 py-1 text-sm font-extrabold ${s.tone}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو رمز المنتج SKU…"
            className="w-full rounded-xl border border-border bg-card py-2 pe-3 ps-9 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold"
        >
          <option value="all">كل المخزون</option>
          <option value="in">متوفر</option>
          <option value="low">مخزون منخفض</option>
          <option value="out">نفد المخزون</option>
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {list.map((p) => {
          const catName = categories.find((c) => c.id === p.category_id)?.name;
          const tone =
            p.stock === 0
              ? "bg-rose-100 text-rose-700"
              : p.stock <= 3
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700";
          return (
            <div key={p.id} className="rounded-3xl border border-border bg-card p-3 shadow-soft">
              <div className="flex items-start gap-3">
                <SmartImage
                  paths={p.images}
                  fallback={fallbackFor(categories.find((c) => c.id === p.category_id)?.slug)}
                  alt={p.name}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.name}</p>
                  <p dir="ltr" className="mt-0.5 text-start text-[11px] text-muted-foreground">
                    SKU: {p.sku ?? "—"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold">{catName ?? "بدون تصنيف"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
                      {p.stock === 0 ? "نفد المخزون" : `المخزون: ${p.stock}`}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-extrabold text-primary">
                    {formatMoney(Number(p.discount_price ?? p.price), label)}
                    {p.discount_price != null && (
                      <span className="ms-2 text-[11px] font-bold text-muted-foreground line-through">
                        {formatMoney(Number(p.price), label)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => toggleStatus(p)}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-bold ${
                    p.status ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.status ? "معروض" : "مخفي"}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-[11px] font-bold text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </button>
                <button
                  onClick={() => remove(p)}
                  className="flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-1.5 text-[11px] font-bold text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </button>
              </div>
            </div>
          );
        })}
        {!isLoading && list.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground lg:col-span-2 2xl:col-span-3">
            لا توجد منتجات مطابقة
          </p>
        )}
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
              <Field label="رمز المنتج SKU">
                <input dir="ltr" placeholder="PR-1001" className={inputCls} value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
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
