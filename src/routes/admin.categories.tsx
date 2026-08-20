import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, Eye, EyeOff, GripVertical, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SmartImage } from "@/components/SmartImage";
import { uploadImage, useAdminCategories } from "@/lib/admin";
import { fallbackFor } from "@/lib/images";
import {
  childrenOf,
  descendantIds,
  rootCategories,
  slugify,
  type Category,
  type CategoryKind,
  type SmartRule,
} from "@/lib/store";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

const KIND_LABELS: Record<CategoryKind, string> = {
  standard: "قسم عادي",
  group: "مجموعة منتجات",
  smart: "قسم ذكي",
  brand: "علامة تجارية",
};

const SMART_LABELS: Record<string, string> = {
  bestseller: "الأكثر مبيعًا",
  featured: "الأعلى تقييمًا",
  new: "المنتجات الجديدة",
  deals: "العروض",
  price: "حسب نطاق السعر",
};

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories = [] } = useAdminCategories();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [subFor, setSubFor] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    parent: "",
    order: "0",
    desc: "",
    icon: "",
    color: "",
    kind: "standard" as CategoryKind,
    smartType: "new",
    smartMin: "",
    smartMax: "",
    active: true,
    seoTitle: "",
    seoDesc: "",
    seoKeys: "",
  });

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    await qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const create = async (value: string, parent: string | null) => {
    if (!value.trim()) { toast.error("اسم التصنيف مطلوب"); return false; }
    setBusy(true);
    const { error } = await supabase.from("categories").insert({
      name: value.trim(),
      slug: slugify(value),
      sort_order: categories.filter((c) => (c.parent_id ?? null) === parent).length,
      parent_id: parent,
      seo_title: `${value.trim()} | إيهاب ستور للعناية والتجميل`,
      seo_description: `تسوقي أفضل منتجات ${value.trim()} الأصلية بأسعار مناسبة مع توصيل لكل محافظات اليمن.`,
      seo_keywords: `${value.trim()}, إيهاب ستور, العناية والتجميل, اليمن`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return false; }
    toast.success("تمت الإضافة");
    await refresh();
    return true;
  };

  const update = async (c: Category, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) { toast.error(error.message); return false; }
    await refresh();
    return true;
  };

  const remove = async (c: Category) => {
    if (childrenOf(categories, c.id).length > 0) { toast.error("احذفي التصنيفات الفرعية أولاً"); return; }
    if (!confirm(`حذف التصنيف "${c.name}"؟`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    await refresh();
  };

  const changeImage = async (c: Category, file: File | undefined, field: "image" | "cover_image" = "image") => {
    if (!file) return;
    try {
      const path = await uploadImage(file, "categories");
      await update(c, { [field]: path });
      toast.success("تم تحديث الصورة");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر الرفع");
    }
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      parent: c.parent_id ?? "",
      order: String(c.sort_order),
      desc: c.description ?? "",
      icon: c.icon ?? "",
      color: c.color ?? "",
      kind: (c.kind ?? "standard") as CategoryKind,
      smartType: c.smart_rule?.type ?? "new",
      smartMin: c.smart_rule?.min != null ? String(c.smart_rule.min) : "",
      smartMax: c.smart_rule?.max != null ? String(c.smart_rule.max) : "",
      active: c.is_active !== false,
      seoTitle: c.seo_title ?? `${c.name} | إيهاب ستور للعناية والتجميل`,
      seoDesc: c.seo_description ?? `تسوقي أفضل منتجات ${c.name} الأصلية مع توصيل لكل محافظات اليمن.`,
      seoKeys: c.seo_keywords ?? `${c.name}, إيهاب ستور, العناية والتجميل, اليمن`,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.name.trim()) { toast.error("اسم التصنيف مطلوب"); return; }
    const rule: SmartRule | null =
      form.kind === "smart"
        ? {
            type: form.smartType as SmartRule["type"],
            min: form.smartMin ? Number(form.smartMin) : null,
            max: form.smartMax ? Number(form.smartMax) : null,
          }
        : null;
    const ok = await update(editing, {
      name: form.name.trim(),
      slug: (form.slug.trim() || slugify(form.name)).toLowerCase(),
      parent_id: form.parent || null,
      sort_order: Number(form.order || 0),
      description: form.desc.trim() || null,
      icon: form.icon.trim() || null,
      color: form.color.trim() || null,
      kind: form.kind,
      smart_rule: rule,
      is_active: form.active,
      seo_title: form.seoTitle.trim() || null,
      seo_description: form.seoDesc.trim() || null,
      seo_keywords: form.seoKeys.trim() || null,
    });
    if (ok) { toast.success("تم التعديل"); setEditing(null); }
  };

  /** Drag & drop: dropping a category on another reorders it within the same parent, or moves it inside. */
  const onDrop = async (target: Category, inside: boolean) => {
    const source = categories.find((c) => c.id === dragId);
    setDragId(null);
    if (!source || source.id === target.id) return;
    if (descendantIds(categories, source.id).includes(target.id)) {
      toast.error("لا يمكن نقل القسم داخل أحد فروعه");
      return;
    }
    if (inside) {
      await update(source, {
        parent_id: target.id,
        sort_order: childrenOf(categories, target.id).length,
      });
      toast.success(`تم نقل «${source.name}» تحت «${target.name}»`);
      return;
    }
    await update(source, { parent_id: target.parent_id, sort_order: target.sort_order });
    const siblings = childrenOf(categories, target.parent_id ?? "").length;
    await supabase
      .from("categories")
      .update({ sort_order: target.sort_order + 1 })
      .eq("id", target.id);
    void siblings;
    await refresh();
    toast.success("تم تغيير الترتيب");
  };

  const parentOptions = (current?: Category) => {
    const blocked = current ? descendantIds(categories, current.id) : [];
    return categories.filter((c) => !blocked.includes(c.id));
  };

  const Row = ({ c, depth }: { c: Category; depth: number }) => {
    const kids = childrenOf(categories, c.id);
    const isOpen = !collapsed[c.id];
    return (
      <div style={{ marginInlineStart: depth ? 16 : 0 }}>
        <div
          draggable
          onDragStart={() => setDragId(c.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.stopPropagation(); void onDrop(c, e.shiftKey); }}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft"
          style={c.color ? { borderInlineStartWidth: 4, borderInlineStartColor: c.color } : undefined}
        >
          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
          {kids.length > 0 ? (
            <button
              onClick={() => setCollapsed((s) => ({ ...s, [c.id]: isOpen }))}
              aria-label="طي"
              className="rounded-lg p-1 text-muted-foreground"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-6" />
          )}
          <SmartImage
            paths={c.image ? [c.image] : []}
            fallback={fallbackFor(c.slug)}
            alt={c.name}
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {KIND_LABELS[(c.kind ?? "standard") as CategoryKind]}
              {c.kind === "smart" && c.smart_rule?.type ? ` • ${SMART_LABELS[c.smart_rule.type] ?? ""}` : ""}
              {` • ${kids.length} فرعي • ترتيب ${c.sort_order}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => update(c, { is_active: !(c.is_active !== false) })}
              title={c.is_active !== false ? "إخفاء" : "إظهار"}
              className="rounded-lg bg-secondary p-2 text-foreground"
            >
              {c.is_active !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button onClick={() => openEdit(c)} title="تعديل" className="rounded-lg bg-secondary p-2 text-primary">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => remove(c)} title="حذف" className="rounded-lg bg-destructive/10 p-2 text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
            <label title="تغيير الصورة" className="cursor-pointer rounded-lg bg-secondary p-2 text-foreground">
              <ImagePlus className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => changeImage(c, e.target.files?.[0])} />
            </label>
            <button
              onClick={() => { setSubFor(c.id); setSubName(""); }}
              title="إضافة قسم فرعي"
              className="rounded-lg bg-secondary p-2 text-primary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {subFor === c.id && (
          <div className="mt-2 flex flex-wrap gap-2" style={{ marginInlineStart: 16 }}>
            <input
              autoFocus
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder={`قسم فرعي تحت: ${c.name}`}
              className={`min-w-40 flex-1 ${inputCls}`}
            />
            <button
              onClick={async () => { if (await create(subName, c.id)) { setSubName(""); setSubFor(null); } }}
              disabled={busy}
              className="rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              حفظ
            </button>
            <button onClick={() => setSubFor(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold">
              إلغاء
            </button>
          </div>
        )}

        {isOpen && kids.length > 0 && (
          <div className="mt-2 space-y-2 border-s-2 border-secondary ps-3">
            {kids.map((k) => (
              <Row key={k.id} c={k} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const roots = rootCategories(categories);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">الأقسام</h1>
      <p className="text-xs text-muted-foreground">
        اسحبي القسم وأفلتيه على قسم آخر لتغيير الترتيب، ومع الضغط على Shift أثناء الإفلات ينتقل ليصبح قسمًا فرعيًا له.
      </p>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم قسم رئيسي جديد"
          className={`min-w-40 flex-1 ${inputCls}`}
        />
        <button
          onClick={async () => { if (await create(name, null)) setName(""); }}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> إضافة قسم رئيسي
        </button>
      </div>

      <div className="space-y-3">
        {roots.map((c) => (
          <Row key={c.id} c={c} depth={0} />
        ))}
        {roots.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            لا توجد أقسام بعد — أضيفي أول قسم رئيسي من الأعلى.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">تعديل القسم</h2>
              <button onClick={() => setEditing(null)} aria-label="إغلاق" className="rounded-lg p-1 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold">الاسم</span>
                <input className={`mt-1 ${inputCls}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-bold">الرابط (slug)</span>
                <input className={`mt-1 ${inputCls}`} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-bold">يتبع لـ</span>
                <select className={`mt-1 ${inputCls}`} value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
                  <option value="">قسم رئيسي</option>
                  {parentOptions(editing).map((r) => (
                    <option key={r.id} value={r.id}>تحت: {r.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold">نوع القسم</span>
                <select
                  className={`mt-1 ${inputCls}`}
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as CategoryKind })}
                >
                  {Object.entries(KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              {form.kind === "smart" && (
                <div className="space-y-3 rounded-2xl bg-secondary/40 p-3">
                  <label className="block">
                    <span className="text-xs font-bold">شرط القسم الذكي</span>
                    <select className={`mt-1 ${inputCls}`} value={form.smartType} onChange={(e) => setForm({ ...form, smartType: e.target.value })}>
                      {Object.entries(SMART_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </label>
                  {form.smartType === "price" && (
                    <div className="flex gap-2">
                      <input className={inputCls} placeholder="أقل سعر" value={form.smartMin} onChange={(e) => setForm({ ...form, smartMin: e.target.value })} />
                      <input className={inputCls} placeholder="أعلى سعر" value={form.smartMax} onChange={(e) => setForm({ ...form, smartMax: e.target.value })} />
                    </div>
                  )}
                </div>
              )}
              <label className="block">
                <span className="text-xs font-bold">الوصف</span>
                <textarea rows={3} className={`mt-1 ${inputCls}`} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
              </label>
              <div className="flex gap-2">
                <label className="block flex-1">
                  <span className="text-xs font-bold">أيقونة (رمز)</span>
                  <input className={`mt-1 ${inputCls}`} placeholder="مثال: ✨" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                </label>
                <label className="block flex-1">
                  <span className="text-xs font-bold">لون القسم</span>
                  <div className="mt-1 flex gap-2">
                    <input type="color" aria-label="لون" className="h-10 w-12 rounded-xl border border-border bg-background" value={form.color || "#D4AF37"} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                    <input className={inputCls} placeholder="#D4AF37" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                  </div>
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-secondary/40 p-3">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <span className="text-xs font-bold">القسم مفعّل ويظهر في المتجر</span>
              </label>
              <label className="block">
                <span className="text-xs font-bold">الترتيب</span>
                <input type="number" className={`mt-1 ${inputCls}`} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border p-3 text-xs font-bold text-primary">
                صورة الغلاف
                <ImagePlus className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => changeImage(editing, e.target.files?.[0], "cover_image")} />
              </label>
              <div className="space-y-3 rounded-2xl bg-secondary/40 p-3">
                <p className="text-xs font-extrabold">تحسين الظهور (SEO)</p>
                <input className={inputCls} placeholder="عنوان الصفحة" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
                <textarea rows={2} className={inputCls} placeholder="وصف الصفحة" value={form.seoDesc} onChange={(e) => setForm({ ...form, seoDesc: e.target.value })} />
                <input className={inputCls} placeholder="الكلمات المفتاحية" value={form.seoKeys} onChange={(e) => setForm({ ...form, seoKeys: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveEdit} className="flex-1 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground">حفظ</button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-6 text-sm font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
